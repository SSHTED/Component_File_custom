@isTest
private class SC_FileRelatedListControllerTest {
    
    @TestSetup
    static void setupTestData() {
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;
        
        ContentVersion testFile1 = new ContentVersion(
            Title = 'Test File 1',
        PathOnClient = 'TestFile1.txt',
        VersionData = Blob.valueOf('Test File 1 Content'),
        IsMajorVersion = true,
        Category__c = 'Category 1'
            );
        insert testFile1;
        
        ContentVersion testFile2;
        
        // 시간 차이를 두고 두 번째 파일 생성
        System.runAs(new User(Id = UserInfo.getUserId())) {
            testFile2 = new ContentVersion(
                Title = 'Test File 2',
            PathOnClient = 'TestFile2.txt',
            VersionData = Blob.valueOf('Test File 2 Content'),
            IsMajorVersion = true,
            Category__c = 'Category 2'
                );
            insert testFile2;
        }
        
        List<ContentVersion> contentVersions = [SELECT ContentDocumentId FROM ContentVersion WHERE Id IN :new List<Id>{testFile1.Id, testFile2.Id}];
        List<ContentDocumentLink> contentDocumentLinks = new List<ContentDocumentLink>();
        for (ContentVersion cv : contentVersions) {
            contentDocumentLinks.add(new ContentDocumentLink(
                LinkedEntityId = testAccount.Id,
            ContentDocumentId = cv.ContentDocumentId
                ));
        }
        insert contentDocumentLinks;
    }
    
    @isTest
    static void testGetFileData() {
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        
        // getFileData 메서드 테스트 (카테고리 및 생성일 필터링)
        Test.startTest();
        Map<String, Object> result1 = SC_FileRelatedListController.getFileData(testAccount.Id, 'Category 1', null);
        
        ContentVersion oldestFile = [SELECT CreatedDate FROM ContentVersion ORDER BY CreatedDate ASC LIMIT 1];
        Map<String, Object> result2 = SC_FileRelatedListController.getFileData(testAccount.Id, null, oldestFile.CreatedDate);
        Test.stopTest();
        
    }
    
    @isTest
    static void testUpdateContentDocumentCategories() {
        List<ContentVersion> testFiles = [SELECT ContentDocumentId FROM ContentVersion];
        List<Id> contentDocumentIds = new List<Id>();
        for (ContentVersion cv : testFiles) {
            contentDocumentIds.add(cv.ContentDocumentId);
        }
        
        // updateContentDocumentCategories 메서드 테스트
        Test.startTest();
        SC_FileRelatedListController.updateContentDocumentCategories(contentDocumentIds, 'Test Category');
        Test.stopTest();
        
        // 결과 검증
        List<ContentVersion> updatedFiles = [
            SELECT Category__c 
            FROM ContentVersion 
            WHERE ContentDocumentId IN :contentDocumentIds
        ];
        System.assertEquals(2, updatedFiles.size());
        for (ContentVersion file : updatedFiles) {
            System.assertEquals('Test Category', file.Category__c);
        }
    }
    
    @isTest
    static void testDeleteFilesByRecordId() {
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        List<ContentVersion> testFiles = [SELECT Id FROM ContentVersion];
        List<String> deleteIdList = new List<String>();
        for (ContentVersion cv : testFiles) {
            deleteIdList.add(cv.Id);
        }
        
        // deleteFilesByRecordId 메서드 테스트
        Test.startTest();
        Map<String, Object> result = SC_FileRelatedListController.deleteFilesByRecordId(testAccount.Id, deleteIdList);
        Test.stopTest();
        
        // 결과 검증
        System.assertEquals(true, result.get('Result'));
        System.assertEquals(2, result.get('Count'));
        List<ContentDocument> remainingFiles = [
            SELECT Id 
            FROM ContentDocument 
            WHERE Id IN (
                SELECT ContentDocumentId 
                FROM ContentVersion 
                WHERE Id IN :deleteIdList
            )
        ];
        System.assertEquals(0, remainingFiles.size());
    }
    
    @isTest
    static void testGetFileDataWithCategory() {
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        
        // 특정 카테고리로 필터링하여 getFileData 메서드 테스트
        Test.startTest();
        Map<String, Object> result = SC_FileRelatedListController.getFileData(testAccount.Id, 'Category 1', null);
        Test.stopTest();
        
        // 결과 검증
        List<ContentVersion> fileList = (List<ContentVersion>)result.get('Result');
        System.assertEquals(1, fileList.size());
        System.assertEquals('Category 1', fileList[0].Category__c);
    }
    
    @isTest
    static void testGetFileDataWithCreatedDate() {
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        
        // 특정 생성일 이후의 파일로 필터링하여 getFileData 메서드 테스트
        Test.startTest();
        Map<String, Object> result = SC_FileRelatedListController.getFileData(testAccount.Id, null, Date.today().addDays(-1));
        Test.stopTest();
        
    }
}