global class SC_DataRelatedListScheduler implements Schedulable {
    global void execute(SchedulableContext SC) {
        Integer BATCH_SIZE = Test.isRunningTest() ? 200 : 1;
		SC_DataRelatedListComponentDataBatch batch = new SC_DataRelatedListComponentDataBatch();
        Database.executeBatch(batch, BATCH_SIZE);
    }
}