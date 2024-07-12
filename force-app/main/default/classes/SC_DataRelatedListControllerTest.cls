@IsTest
public class SC_DataRelatedListControllerTest {
    
    @TestSetup
    static void makeData(){
        // 프로필 가져오기
        Profile p = [SELECT Id FROM Profile WHERE Name='시스템 관리자'];
        
        // 테스트 사용자 생성
        User testUser = new User(Alias = 'standt', Email='standarduser@testorg.com',
        EmailEncodingKey='UTF-8', LastName='Testing RelatedList', LanguageLocaleKey='en_US',
        LocaleSidKey='en_US', ProfileId = p.Id,
        TimeZoneSidKey='America/Los_Angeles', UserName='RelatedListTestuser@testorg.com');
        insert testUser;
        
        // 테스트 계정 생성
        Account testAccount = new Account(Name = 'Test Account');
        insert testAccount;
        
        // 테스트 연락처 생성
        Contact testContact = new Contact(
            LastName = 'Test Contact',
        AccountId = testAccount.Id
            );
        insert testContact;
        
        // 테스트 기회 생성
        Opportunity testOpportunity = new Opportunity(
            Name = 'Test Opportunity',
        AccountId = testAccount.Id,
        StageName = 'Prospecting',
        CloseDate = Date.today().addDays(30),
        Amount = 10000
            );
        insert testOpportunity;
        
        // SC_DataRelatedListRestApi__c 객체의 ComponentData__c 필드를 실제 API 응답과 유사하게 수정
        SC_DataRelatedListRestApi__c testData = new SC_DataRelatedListRestApi__c(
            ParentObject__c = 'Account',
        ChildObject__c = 'Contact',
        RecordTypeId__c = Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId(),
        ExternalKey__c = 'Account_' + Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId() + '_Contact',
        ComponentData__c = '[{"sobject":"Contact","accessLevelRequiredForCreate":null,"buttons":[{"behavior":null,"colors":[{"color":"A094ED","context":"primary","theme":"theme4"}],"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":[{"contentType":"image/svg+xml","height":0,"theme":"theme4","url":"/img/icon/t4v35/action/new_contact.svg","width":0}],"label":"New","name":"NewContact"}],"columns":[{"field":"Contact.Name","fieldApiName":"Name","label":"Contact Name","lookupId":"Id","name":"Name","sortable":true},{"field":"Contact.Title","fieldApiName":"Title","label":"Title","name":"Title","sortable":true},{"field":"Contact.Email","fieldApiName":"Email","label":"Email","name":"Email","sortable":true},{"field":"Contact.Phone","fieldApiName":"Phone","label":"Phone","name":"Phone","sortable":true}],"custom":false,"field":"AccountId","label":"Contacts","limitRows":5,"name":"Contacts","sort":[{"ascending":true,"column":"LastName"}]}]'
            );
        insert testData;
        
        SC_DataRelatedListRestApi__c testDataOpportunity = new SC_DataRelatedListRestApi__c(
            ParentObject__c = 'Account',
        ChildObject__c = 'Opportunity',
        RecordTypeId__c = Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId(),
        ExternalKey__c = 'Account_' + Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId() + '_Opportunity',
        ComponentData__c = '[{"sobject":"Opportunity","accessLevelRequiredForCreate":null,"buttons":[{"behavior":null,"colors":[{"color":"FF5D2D","context":"primary","theme":"theme4"}],"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":[{"contentType":"image/svg+xml","height":0,"theme":"theme4","url":"/img/icon/t4v35/action/new_opportunity.svg","width":0}],"label":"New","name":"NewOpportunity"}],"columns":[{"field":"Opportunity.Name","fieldApiName":"Name","label":"Opportunity Name","lookupId":"Id","name":"Name","sortable":true},{"field":"Opportunity.StageName","fieldApiName":"StageName","label":"Stage","name":"StageName","sortable":true},{"field":"Opportunity.Amount","fieldApiName":"Amount","label":"Amount","name":"Amount","sortable":true},{"field":"Opportunity.CloseDate","fieldApiName":"CloseDate","label":"Close Date","name":"CloseDate","sortable":true}],"custom":false,"field":"AccountId","label":"Opportunities","limitRows":5,"name":"Opportunities","sort":[{"ascending":false,"column":"CloseDate"}]}]'
            );
        
        insert testDataOpportunity;
    }
    
    @IsTest
    static void testGetInit() {
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        
        Test.startTest();
        Map<String, Object> result = SC_DataRelatedListController.getInit(testAccount.Id, 'Account', 'Contact');
        Test.stopTest();
        
        // 검증
        System.assert(result != null, '결과 값이 null입니다.');
        System.assert(result.containsKey('Result'), '결과 값에 "Result" 키가 없습니다.');
        Map<String, Object> resultMap = (Map<String, Object>) result.get('Result');
        System.assertEquals(testAccount.Id, resultMap.get('RecordId'), 'RecordId가 일치하지 않습니다.');
        System.assertEquals('Account', resultMap.get('ParentObjName'), 'ParentObjName이 일치하지 않습니다.');
        System.assertEquals('Contact', resultMap.get('ComponentObjName'), 'ComponentObjName이 일치하지 않습니다.');
    }
    
    @IsTest
    static void testGetData() {
        // 테스트 데이터 설정
        Account testAccount = [SELECT Id FROM Account WHERE Name = 'Test Account' LIMIT 1];
        
        // getOrgAndUserInfo 메서드 모의 처리
        SC_DataRelatedListController.mockOrgAndUserInfo = new Map<String, Object>{
            'OrgInfoSetting' => new Map<String, Object>{
                'CurrencySymbol' => '$',
                'DefaultCurrencyIsoCode' => 'USD'
            },
            'UserInfoSetting' => new Map<String, Object>{
                'UserLocale' => 'en',
                'UserTimeZone' => 'America/Los_Angeles'
            }
        };
        
        Test.startTest();
        // getData 메서드 호출
        Map<String, Object> result = SC_DataRelatedListController.getData(
            testAccount.Id, 'Account', 'Contact', null
            );
        Test.stopTest();
        
        // 결과 검증
        System.assertNotEquals(null, result, 'Result should not be null');
        Map<String, Object> resultData = (Map<String, Object>)result.get('Result');
        System.assertNotEquals(null, resultData.get('1Lv'), '1Lv data should exist');
        
        // ConnectApi 관련 부분 검증
        System.assertNotEquals(null, resultData.get('OrgInfoSetting'), 'OrgInfoSetting should be present');
        System.assertNotEquals(null, resultData.get('UserInfoSetting'), 'UserInfoSetting should be present');
    }
    
    @IsTest
    static void testDeleteRecord() {
        Contact testContact = [SELECT Id FROM Contact LIMIT 1];
        String recordIdList = '[\"' + testContact.Id + '\"]';
        
        Test.startTest();
        Map<String, Object> result = SC_DataRelatedListController.deleteRecord(recordIdList);
        Test.stopTest();
        
        System.assertEquals(true, result.get('Result'), 'Delete operation should be successful');
        System.assertEquals(1, result.get('Count'), 'One record should be deleted');
    }
    
    
    @IsTest
    static void testFindUsers() {
        Test.startTest();
        List<User> users = SC_DataRelatedListController.findUsers('Test');
        Test.stopTest();
        
        System.assertNotEquals(0, users.size(), 'Should return some users');
    }
    
    @IsTest
    static void testUpdateData() {
        Contact testContact = [SELECT Id, LastName FROM Contact LIMIT 1];
        String jsonData = '[{"id":"' + testContact.Id + '","values":{"LastName":"Updated Test Contact"}}]';
        
        Test.startTest();
        String result = SC_DataRelatedListController.updateData(jsonData, 'Contact');
        Test.stopTest();
        
        System.assertEquals('Success', result, 'Update operation should be successful');
        Contact updatedContact = [SELECT LastName FROM Contact WHERE Id = :testContact.Id];
        System.assertEquals('Updated Test Contact', updatedContact.LastName, 'Contact name should be updated');
    }
    
    @IsTest
    static void testGetReadonlyFields() {
        Test.startTest();
        Map<String, List<String>> result = SC_DataRelatedListController.getReadonlyFields('Account', 'Contact');
        Test.stopTest();
        
        System.assertNotEquals(null, result.get('Account'), 'Account readonly fields should not be null');
        System.assertNotEquals(null, result.get('Contact'), 'Contact readonly fields should not be null');
    }
    
    @IsTest
    static void testChangeOwner() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        User newOwner = [SELECT Id FROM User WHERE Profile.Name = '시스템 관리자' AND IsActive = true LIMIT 1];
        String recordIdList = '[\"' + testAccount.Id + '\"]';
        
        Test.startTest();
        Map<String, Object> result = SC_DataRelatedListController.changeOwner(recordIdList, newOwner.Id);
        Test.stopTest();
        
        System.assertEquals(true, result.get('Result'), 'Change owner operation should be successful');
        System.assertEquals(1, result.get('Count'), 'One record should be updated');
    }
    
    @IsTest
    static void testGetRowDataById() {
        Account testAccount = [SELECT Id FROM Account LIMIT 1];
        
        Test.startTest();
        Map<String, Object> result = SC_DataRelatedListController.getRowDataById(testAccount.Id);
        Test.stopTest();
        
        System.assertNotEquals(null, result.get('Result'), 'Result should not be null');
    }
    
    // 배치 테스트 코드
    @IsTest
    static void testSC_DataRelatedListComponentDataBatch() {
        // 테스트 데이터 설정
        String recordTypeId = Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId();
        List<String> objNameList = new List<String>{'Account', 'Contact'};
        Map<String, Object> paramMap = new Map<String, Object>{
            'recordTypeId' => recordTypeId,
            'objNameList' => objNameList
        };
        String paramMapJson = JSON.serialize(paramMap);
        
        // getRelatedLayoutsByRestAPI 메소드에 대한 모의 응답 설정
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        
        // 배치 실행
        Test.startTest();
        SC_DataRelatedListComponentDataBatch batch = new SC_DataRelatedListComponentDataBatch(paramMapJson);
        Database.executeBatch(batch);
        Test.stopTest();
        
        // 결과 검증
        SC_DataRelatedListRestApi__c updatedApi = [SELECT ComponentData__c FROM SC_DataRelatedListRestApi__c WHERE ParentObject__c = 'Account' LIMIT 1];
        System.assertNotEquals('[]', updatedApi.ComponentData__c, 'ComponentData should be updated');
        
        // 배치 결과 검증은 배치 클래스에 접근할 수 없으므로 생략
    }
    
    @IsTest
    static void testSC_DataRelatedListScheduler() {
        // 테스트 데이터 준비는 @TestSetup 메소드에서 이미 수행됨
        
        // 스케줄 작업 생성을 위한 CRON 표현식
        String CRON_EXP = '0 0 0 15 3 ? 2030';
        
        Test.startTest();
        // 스케줄러 인스턴스 생성 및 스케줄 등록
        String jobId = System.schedule('Test SC_DataRelatedListScheduler',
        CRON_EXP,
        new SC_DataRelatedListScheduler());
        
        // 스케줄된 작업 조회
        CronTrigger ct = [SELECT Id, CronExpression, TimesTriggered, NextFireTime
                      FROM CronTrigger 
                      WHERE Id = :jobId];
        
        // 스케줄 작업이 등록되었는지 확인
        System.assertEquals(CRON_EXP, ct.CronExpression);
        System.assertEquals(0, ct.TimesTriggered);
        System.assertEquals('2030-03-15 00:00:00', String.valueOf(ct.NextFireTime));
        
        // 실제 실행을 시뮬레이션
        SC_DataRelatedListScheduler scheduler = new SC_DataRelatedListScheduler();
        scheduler.execute(null);
        
        Test.stopTest();
        
        // 배치 작업이 실행되었는지 간접적으로 확인
        // 실제 배치 실행 결과를 확인하기 위해서는 배치 클래스 내에 로그를 남기거나
        // 결과를 저장하는 로직을 추가해야 할 수 있습니다.
        List<AsyncApexJob> jobsAfterTest = [SELECT Id, Status, JobType 
                                        FROM AsyncApexJob 
                                        WHERE JobType = 'BatchApex'
                                        ORDER BY CreatedDate DESC 
                                        LIMIT 1];
        
        System.assertEquals(1, jobsAfterTest.size(), 'Batch job should have been created');
        // 참고: 실제 상태는 'Queued'일 수 있습니다. 테스트 맥락에 따라 조정이 필요할 수 있습니다.
        System.assertEquals('Queued', jobsAfterTest[0].Status, 'Batch job should be queued or processing');
    }
    
    @IsTest
    static void testSC_DataRelatedListManualController() {
        // 테스트 데이터 설정
        String recordTypeId = Schema.SObjectType.Account.getRecordTypeInfos().get(0).getRecordTypeId();
        List<String> objNameList = new List<String>{'Account', 'Contact'};
        Map<String, Object> paramMap = new Map<String, Object>{
            'recordTypeId' => recordTypeId,
            'objNameList' => objNameList
        };
        String paramMapJson = JSON.serialize(paramMap);
        
        // 테스트용 SC_DataRelatedListRestApi__c 레코드 생성
        SC_DataRelatedListRestApi__c testApi = new SC_DataRelatedListRestApi__c(
            RecordTypeId__c = recordTypeId,
        ParentObject__c = 'Account',
        ComponentData__c = '[]'
            );
        insert testApi;
        
        // 배치 실행을 모의 처리하기 위한 설정
        Test.setMock(HttpCalloutMock.class, new MockHttpResponseGenerator());
        
        Test.startTest();
        
        // 테스트 모드 설정
        SC_DataRelatedListManualController.isTest = true;
        
        // BatchManualExecute 메소드 호출 (실제 배치 실행은 모의 처리됨)
        SC_DataRelatedListManualController.BatchManualExecute(paramMapJson);
        
        Test.stopTest();
        
        // SC_DataRelatedListRestApi__c 레코드가 업데이트되었는지 확인
        testApi = [SELECT ComponentData__c FROM SC_DataRelatedListRestApi__c WHERE Id = :testApi.Id];
        System.assertNotEquals('[]', testApi.ComponentData__c, 'ComponentData__c should be updated');
    }
    
    private class MockHttpResponseGenerator implements HttpCalloutMock {
        public HTTPResponse respond(HTTPRequest req) {
            HttpResponse res = new HttpResponse();
            res.setHeader('Content-Type', 'application/json');
            res.setBody('{"relatedLists": [{"name": "Contacts", "label": "Contacts"}]}');
            res.setStatusCode(200);
            return res;
        }
    }
}