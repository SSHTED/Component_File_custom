global with sharing class SC_DataRelatedListManualController {
    @TestVisible
    private static Boolean isTest = false;

    @AuraEnabled
    global static void BatchManualExecute(String paramMap){
        if (!isTest) {
            SC_DataRelatedListComponentDataBatch batch = new SC_DataRelatedListComponentDataBatch(paramMap);
            Database.executeBatch(batch, 1);
        } else {
            // 테스트 시 배치를 실행하지 않고 로직만 검증
            SC_DataRelatedListComponentDataBatch batch = new SC_DataRelatedListComponentDataBatch(paramMap);
            Database.QueryLocator ql = batch.start(null);
            List<SObject> scope = Database.query(ql.getQuery());
            if (!scope.isEmpty()) {
                batch.execute(null, scope);
            }
            batch.finish(null);
        }
    }
}