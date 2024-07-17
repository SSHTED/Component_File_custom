global class SC_DataRelatedListScheduler implements Schedulable {
    private Integer batchSize;
    private String paramMap;

    // 기본 생성자
    global SC_DataRelatedListScheduler() {
        this(1, null);
    }

    // 배치 크기와 파라미터 맵을 받는 생성자
    global SC_DataRelatedListScheduler(Integer batchSize, String paramMap) {
        this.batchSize = batchSize;
        this.paramMap = paramMap;
    }

    global void execute(SchedulableContext SC) {
        Integer executeBatchSize = Test.isRunningTest() ? 200 : this.batchSize;
        
        SC_DataRelatedListComponentDataBatch batch;
        if (String.isNotBlank(this.paramMap)) {
            batch = new SC_DataRelatedListComponentDataBatch(this.paramMap);
        } else {
            batch = new SC_DataRelatedListComponentDataBatch();
        }
        
        Database.executeBatch(batch, executeBatchSize);
    }
}