/**
 * @Class : SC_DataRelatedListComponentDataBatch
 *
 * @Method : 
 * 
 * @Author : 안종민
 * @Date : 2024-01-16
 * @Version : 1.0
 * @Modified : 
 *  ---------------------------------------------
 *  NO | Date       | Modifier      | Description
 *  ---------------------------------------------
 *  1. | 2024-01-16 | 안종민        | 최초작성
 */
global without sharing class SC_DataRelatedListComponentDataBatch implements Database.Batchable<sObject>, Database.Stateful, Database.AllowsCallouts {

	global String batchName = 'SC_DataRelatedListComponentDataBatch'; 	// 배치명
	global Integer batchExecuteCount = 0; 			                    // 총 execute 건수
	global Integer successCount = 0; 			                        // 처리된 데이터 건수
	global Integer failCount = 0; 			                            // 실패한 데이터 건수
    global String resultLog = '';                                       // 오류 로그

    global String recordTypeId = '';
    global List<Object> objNameList = new List<Object>();
    global Map<String, Object> tempParamMap = new Map<String, Object>();
    
    global SC_DataRelatedListComponentDataBatch(){}
	global SC_DataRelatedListComponentDataBatch(String paramMap) {
        tempParamMap = (Map<String, Object>)JSON.deserializeUntyped(paramMap);
        recordTypeId = String.valueOf(tempParamMap.get('recordTypeId'));
        if(recordTypeId == null || recordTypeId == '') recordTypeId = '012000000000000AAA';
        objNameList = (List<Object>)tempParamMap.get('objNameList');
    }

	global Database.QueryLocator start(Database.BatchableContext BC) {
        String soql = ' SELECT RecordTypeId__c, ParentObject__c, ComponentData__c FROM SC_DataRelatedListRestApi__c ';
        if(!objNameList.contains(null)) soql += ' WHERE RecordTypeId__c = \'' +recordTypeId+ '\' AND ParentObject__c IN (\'' +String.join(objNameList, '\', \'') + '\')';
        System.debug(recordTypeId + '||' + objNameList + '||' + soql);
		return Database.getQueryLocator(SOQL);
	}

	global void execute(Database.BatchableContext BC, List<sObject> scope) {
		Integer batchSize = scope.size();
		batchExecuteCount++;

		try {
			successCount += batchSize;

            String oRecordTypeId = '';
            String oParentObjectName = '';
            List<Object> relatedList = new List<Object>();

			for(sObject o : scope){
                oRecordTypeId = String.valueOf(o.get('RecordTypeId__c'));
                oParentObjectName = String.valueOf(o.get('ParentObject__c'));
                Map<String, Object> layout = (Map<String, Object>)JSON.deserializeUntyped(SC_DataRelatedListController.getRelatedLayoutsByRestAPI(oRecordTypeId, oParentObjectName));

                if(layout.containsKey('errorCode')){
                    System.debug('errorCode >>> ' + layout.get('errorCode'));
                    System.debug('message >>> ' + layout.get('message'));
                } else {
                    relatedList = (List<Object>)layout.get('relatedLists');
                    o.put('ComponentData__c', JSON.serializePretty(relatedList));
                }
			}

			upsert scope;
		} catch(Exception e) {
            failCount++;
            System.debug('[EXECUTE Error] ' + batchName);
            System.debug(e);
            resultLog += '\n[EXECUTE Error] (' + scope.get(0).Id + ') ' + e;
            throw e;
		}
	}

	global void finish(Database.BatchableContext BC) {
        System.debug('[FINISH] ' + batchName + ' ( ' + batchExecuteCount + ' )' + ' [S] ' + successCount + ' [F] ' + failCount);

        // 배치가 종료 되었다는 알람 보내기
        UTIL_Notification.unCalloutSend(
            'OnlyDesktop'
            , System.UserInfo.getUserId()
            , null
            , batchName + ' 배치 완료'                                                         // 알람 제목
            , failCount == 0 ? '배치 작업이 완료 되었습니다.' : '배치 작업 오류 : ' + resultLog  // 알람 내용
            , new Set<String>{ 
                System.UserInfo.getUserId()
            }
        );
	}
}