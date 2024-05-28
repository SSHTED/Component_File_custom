global with sharing class SC_FileRelatedListController {

    // init
    // @AuraEnabled(cacheable=true)
    // global static Map<String, Object> getInit(){
    //     Map<String, Object> resultMap = new Map<String, Object>();
    //     resultMap.put('Result', true);
    //     return resultMap;
    // }

    // 레코드의 파일 데이터 가져오기
    // ContentVersion 오브젝트의 서브쿼리로 ContentDocumentLink를 사용할 수 없다.
    // 그래서 두 번의 쿼리 수행이 필요.
    // ContentDocumentLink 쿼리 결과 -> ContentVersion의 IsLatest = true, 동일한 ContentDocumentId 값 비교
    @AuraEnabled(cacheable=true)
    global static Map<String, Object> getFileData(String recordId, String category){
        Map<String, Object> resultMap = new Map<String, Object>();
        Set<Id> cdIdList = new Set<Id>();
        
        // ContentDocumentLink에서 해당 레코드의 파일 목록 가져오기
        for(ContentDocumentLink cd : [SELECT ContentDocumentId FROM ContentDocumentLink WHERE LinkedEntityId = :recordId]){
            cdIdList.add(cd.ContentDocumentId);
        }
        
        String soql = '  SELECT ' +
                      '    Id, Title, Description, ReasonForChange, SharingOption ' +
                      '    , SharingPrivacy, PathOnClient, ContentBodyId, FileType, PublishStatus, ContentSize ' +
                      '    , FileExtension, TextPreview, Category__c, VersionDataUrl, CreatedDate ' +
                      '  FROM ContentVersion ' +
                      '  WHERE ContentDocumentId IN :cdIdList ' +
                      '    AND IsLatest = true ';
        
        if(String.isNotBlank(category)){
            soql += ' AND Category__c = :category ';
        }
        
        try {
            List<ContentVersion> fileList = Database.query(soql);
            resultMap.put('Result', fileList);
        } catch (DmlException e) {
            System.debug('DmlException Error >>> ' + e.getMessage());
            resultMap.put('Result', false);
        }
        
        return resultMap;
    }

    // 파일 데이터 저장
    // ContentVersion 오브젝트에 insert만 해도 데이터를 사용할 수 있지만 
    // ContentDocumentLink 오브젝트에도 insert를 해야 세일즈포스의 스탠다드 기능들을 사용할 수 있다.
    // ex. 버전 관리, 공유, 검색 등 관리 기능들 사용 가능
    // 추후 파라미터가 더 필요하면 추가
    @AuraEnabled
    global static void saveData(String fileObj){
        Map<String, Object> fileMap = (Map<String, Object>)JSON.deserializeUntyped(fileObj);

        try {
            // ContentVersion 레코드 생성
            ContentVersion contentVersion = new ContentVersion(
                Title = objectToString(fileMap.get('fileName'))
                , VersionData = (Blob)fileMap.get('fileBody')
                , PathOnClient = objectToString(fileMap.get('fileName'))
                , Category__c = objectToString(fileMap.get('category'))
            );
    
            // ContentVersion 레코드 삽입
            insert contentVersion;
            
            // ContentDocumentLink 레코드 생성
            ContentDocumentLink contentLink = new ContentDocumentLink(
                ContentDocumentId = [SELECT Id, ContentDocumentId FROM ContentVersion WHERE Id = :contentVersion.Id].ContentDocumentId,
                LinkedEntityId = objectToString(fileMap.get('recordId')),
                ShareType = 'V' // 모든 사용자에게 공유
            );
    
            // ContentDocumentLink 레코드 삽입
            insert contentLink;
        } catch (DmlException e) {
            System.debug('Insert에 실패하였습니다. Error >>> ' + e);
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