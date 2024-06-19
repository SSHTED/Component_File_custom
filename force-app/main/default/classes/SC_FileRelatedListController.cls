global with sharing class SC_FileRelatedListController {

    // 레코드의 파일 데이터 가져오기
    // ContentVersion 오브젝트의 서브쿼리로 ContentDocumentLink를 사용할 수 없다.
    // 그래서 두 번의 쿼리 수행이 필요.
    // ContentDocumentLink 쿼리 결과 -> ContentVersion의 IsLatest = true, 동일한 ContentDocumentId 값 비교
    @AuraEnabled(cacheable=true)
    global static Map<String, Object> getFileData(String recordId, String category, DateTime latestCreatedDate) {
        System.debug('recordId >>> ' + recordId);
        System.debug('category >>> ' + category);
        System.debug('latestCreatedDate >>> ' + latestCreatedDate);
        Map<String, Object> resultMap = new Map<String, Object>();
        Set<Id> cdIdList = new Set<Id>();

        // ContentDocumentLink에서 해당 레코드의 파일 목록 가져오기
        for(ContentDocumentLink cd : [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId]){
            cdIdList.add(cd.ContentDocumentId);
        }

        String soql = ' SELECT ' +
                    '    Id, ContentDocumentId, Title, Description, ReasonForChange, SharingOption' +
                    '    , SharingPrivacy, PathOnClient, ContentBodyId, FileType, PublishStatus, ContentSize' +
                    '    , FileExtension, TextPreview, Category__c, VersionDataUrl, CreatedDate, SystemModstamp' +
                    ' FROM ContentVersion' +
                    ' WHERE ContentDocumentId IN :cdIdList' +
                    '   AND IsLatest = true';
        
        if (String.isNotBlank(category)) { // 카테고리가 비어있지 않은지 확인
            soql += ' AND Category__c = :category';
        } 

        if (latestCreatedDate != null) {
            soql += '   AND CreatedDate > :latestCreatedDate';
        }

        System.debug('soql >>> ' + soql);

        //오브젝트 가져오기
        String objectApiName = getObjectApiName(Id.valueOf(recordId));

        try {
            List<ContentVersion> fileList = Database.query(soql);
            System.debug('fileList >>> ' + fileList);
            
            resultMap.put('ObjectApiName', objectApiName);
            resultMap.put('Result', fileList);
        } catch (QueryException e) {
            System.debug('QueryException Error >>> ' + e.getMessage());

            resultMap.put('Result', false);
        }

        return resultMap;
    }

    private static String getObjectApiName(Id recordId){
        String objectApiName = '';

        if (recordId != null ){
            String sObjName = recordId.getSObjectType().getDescribe().getName();
            objectApiName = sObjName;
            System.debug('getObjectApiName sObjName >>> ' + sObjName);
        }

        return objectApiName;
    }

    @AuraEnabled
    public static void updateContentDocumentCategories(List<Id> contentDocumentIds, String category) {
        System.debug('카테고리 :' + category);
        try {
            // ContentDocument ID 목록으로 ContentVersion 레코드 조회
            List<ContentVersion> contentVersions = [
                SELECT Id, ContentDocumentId, Category__c 
                FROM ContentVersion 
                WHERE ContentDocumentId IN :contentDocumentIds
                AND IsLatest = true
            ];
            
            System.debug('contentVersions: ' + contentVersions);
            
            // 업데이트가 필요한 ContentVersion 레코드를 저장할 리스트
            List<ContentVersion> contentVersionsToUpdate = new List<ContentVersion>();
            
            // 카테고리 필드 업데이트
            for (ContentVersion cv : contentVersions) {
                // 기존 레코드의 Category__c 값과 비교하여 변경된 경우에만 업데이트 대상에 추가
                if (cv.Category__c != category) {
                    cv.Category__c = category;
                    contentVersionsToUpdate.add(cv);
                }
            }

            System.debug('contentVersionsToUpdate: ' + contentVersionsToUpdate);

            // ContentVersion 레코드 업데이트
            if (!contentVersionsToUpdate.isEmpty()) {
                update contentVersionsToUpdate;


                System.debug('Updated ' + contentVersionsToUpdate.size() + ' ContentVersion records.');
            } else {
                System.debug('No ContentVersion records to update.');
            }
            
        } catch (Exception e) {
            System.debug('Error in updateContentDocumentCategories: ' + e.getMessage());
            throw new AuraHandledException('Error updating file categories: ' + e.getMessage());
        }
    }

    //삭제
    //데이터 호출과 마찬가지로 두 번의 쿼리 필요
    @AuraEnabled
    global static Map<String, Object> deleteFilesByRecordId(String recordId, List<String> deleteIdList) {
        Map<String, Object> resultMap = new Map<String, Object>();
        Set<Id> cdIdSet = new Set<Id>();
        
        try {
            // 삭제할 파일의 ContentDocumentId 목록 필터링
            List<Id> deleteIdSet = new List<Id>();
            for (String deleteId : deleteIdList) {
                deleteIdSet.add(Id.valueOf(deleteId));
            }
            System.debug('recordId: ' + recordId);
            System.debug('deleteIdSet: ' + deleteIdSet);
            
            // 삭제할 ContentVersion 레코드 가져오기
            List<ContentVersion> deleteContentVersions = [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN :deleteIdSet];
            System.debug('deleteContentVersions: ' + deleteContentVersions);
            
            // 삭제할 ContentDocument ID 추출
            Set<Id> deleteContentDocumentIdSet = new Set<Id>();
            for (ContentVersion cv : deleteContentVersions) {
                deleteContentDocumentIdSet.add(cv.ContentDocumentId);
            }
            System.debug('deleteContentDocumentIdSet: ' + deleteContentDocumentIdSet);
            
            // 삭제할 ContentDocument 레코드 가져오기
            List<ContentDocument> deleteContentDocuments = [SELECT Id FROM ContentDocument WHERE Id IN :deleteContentDocumentIdSet];
            System.debug('deleteContentDocuments: ' + deleteContentDocuments);
            
            // 삭제할 ContentDocumentLink 레코드 가져오기
            List<ContentDocumentLink> deleteContentDocumentLinks = [SELECT Id FROM ContentDocumentLink WHERE ContentDocumentId IN :deleteContentDocumentIdSet AND LinkedEntityId = :recordId];
            System.debug('deleteContentDocumentLinks: ' + deleteContentDocumentLinks);
            
            if (!deleteContentDocuments.isEmpty() && !deleteContentDocumentLinks.isEmpty()) {
                delete deleteContentDocumentLinks;
                delete deleteContentDocuments;

                Database.setSavepoint();

                resultMap.put('Result', true);
                resultMap.put('Count', deleteContentDocuments.size());
                System.debug('deleteFilesByRecordId successful. 삭제된 레코드 수 : ' + deleteContentDocuments.size());
            } else {
                resultMap.put('Result', false);
                resultMap.put('Count', 0);
            }
        } catch (Exception e) {
            resultMap.put('Result', false);
            resultMap.put('ErrorMessage', e.getMessage());
            System.debug('deleteFilesByRecordId ErrorMessage: ' + e.getMessage());
        }
        
        return resultMap;
    }

    // return object to String
    private static String objectToString(object o) {
        return o == null ? '' : String.valueOf(o);
    }
}