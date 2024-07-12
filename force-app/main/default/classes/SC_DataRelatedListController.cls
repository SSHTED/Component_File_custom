/**
 * @Class : SC_DataRelatedListController
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
global with sharing class SC_DataRelatedListController {
    // 이전 참조하는 필드
    /*
        RestAPI로 데이터를 가져올 때 1Lv의 데이터는 무조건 Id를 조건으로 쿼리를 실행하지만
        2Lv 부터는 1Lv의 하위 오브젝트에서 상위 오브젝트를 참조하는 필드를 조건으로 쿼리 해야한다.
        그러려면 이전 하위 오브젝트의 상위 오브젝트를 참조하는 필드 정보가 필요하기 때문에 해당 변수를 전역으로 선언.
        
        ※
        record object : Account
        parent object : Contact
        component object : Opportunity
        위와 같을 때 Opportunity의 데이터를 가져오려면 기회의 참조필드 Contact가 아니라 Account의 참조필드를 조회해야 한다.
    */
    @TestVisible
    private class BeforeReferenceField {
        @AuraEnabled public String fldNm {get; set;}
    }
    
    @TestVisible
    private static Map<String, Object> mockOrgAndUserInfo;

    @TestVisible
    private static Map<String, Object> getOrgAndUserInfo() {
        if (Test.isRunningTest() && mockOrgAndUserInfo != null) {
            return mockOrgAndUserInfo;
        }

        Map<String, Object> infoMap = new Map<String, Object>();
        Map<String, Object> orgInfoSettingMap = new Map<String, Object>();
        Map<String, Object> userInfoMap = new Map<String, Object>();

        ConnectApi.OrganizationSettings orgSettings = ConnectApi.Organization.getSettings();

        orgInfoSettingMap.put('CurrencySymbol', orgSettings.UserSettings.currencySymbol);
        orgInfoSettingMap.put('DefaultCurrencyIsoCode', orgSettings.features.defaultCurrencyIsoCode);

        userInfoMap.put('UserLocale', UserInfo.getLocale().split('_')[0]);
        userInfoMap.put('UserTimeZone', String.valueOf(UserInfo.getTimeZone()));

        infoMap.put('OrgInfoSetting', orgInfoSettingMap);
        infoMap.put('UserInfoSetting', userInfoMap);

        return infoMap;
    }

    @AuraEnabled(cacheable=true)
    global static Map<String, Object> getInit(String recordId, String parentObjName, String componentObjName){
        Map<String, Object> resultMap = new Map<String, Object>();
        Map<String, Object> tempMap = new Map<String, Object>();
        tempMap.put('RecordId', recordId);
        tempMap.put('ParentObjName', parentObjName);
        tempMap.put('ComponentObjName', componentObjName);
        resultMap.put('Result', tempMap);
        System.debug('tempMap >>> ' + tempMap);
        return resultMap;
    }

    // 컴포넌트 데이터 가져오기
    /*
        컴포넌트로 추가된 오브젝트의 데이터를 가져온다.
        컴포넌트 추가 시 parentObjName 변수만 입력되면 1Lv의 데이터만 표출.
        parentObjName, componentObjName 변수 모두 입력되면 2Lv까지 표출.
    */
    // @AuraEnabled
    @AuraEnabled
    global static Map<String, Object> getData(String recordId, String parentObjName, String componentObjName, String sumObj){
        Map<String, Object> resultMap = new Map<String, Object>();
        Map<String, Object> tempMap = new Map<String, Object>();
        List<Object> relatedDataList = new List<Object>();
        BeforeReferenceField befoRefFld = new BeforeReferenceField();
        List<DK_CX_SC__SC_DataRelatedListRestApi__c> cDataList = new List<DK_CX_SC__SC_DataRelatedListRestApi__c>();
        
        System.debug('recordId >>> ' + recordId);
        System.debug('parentObjName : ' + parentObjName);
        System.debug('componentObjName : ' + componentObjName);
        
        Id refindeRecordId = Id.valueOf(recordId);
        String recordObjName = refindeRecordId.getSObjectType().getDescribe().getName();
        String tempParentObjName = recordObjName;
        String tempChildObjName = '';
        
        System.debug('tempParentObjName : ' + tempParentObjName);

        // 1Lv, 2Lv 데이터 저장
        Integer cnt = 1;
        if(componentObjName == '' || componentObjName == null){ // 2Lv 관계가 비어있을 때
            System.debug('getData componentObjName is null');
            tempChildObjName = parentObjName;
            tempMap.put(cnt + 'Lv', setRelatedData(refindeRecordId, tempParentObjName, tempChildObjName, befoRefFld, cDataList));
        } else if(parentObjName == '' || parentObjName == null){ // 1Lv 관계가 비어있을 때
            System.debug('getData parentObjName is null');
            tempChildObjName = componentObjName;
            tempMap.put(cnt + 'Lv', setRelatedData(refindeRecordId, tempParentObjName, tempChildObjName, befoRefFld, cDataList));
        } else if((componentObjName == '' || componentObjName == null) && (parentObjName == '' || parentObjName == null)){
            System.debug('getData componentObjName, parentObjName is null');
            tempMap.put(cnt + 'Lv', false);
        } else {
            List<String> objNameList = new List<String>{parentObjName, componentObjName};
            Boolean firstIteration = true;

            for(String objNm : objNameList){
                // 첫 for문 이후 하위 오브젝트를 상위 오브젝트로 대입하여 더 깊이 탐색
                if(firstIteration){
                    firstIteration = false;
                } else {
                    tempParentObjName = tempChildObjName;
                }

                System.debug('objNm : ' + objNm);
                tempChildObjName = objNm;
                tempMap.put(cnt + 'Lv', setRelatedData(refindeRecordId, tempParentObjName, tempChildObjName, befoRefFld, cDataList));

                cnt++;
            }
        }
        
        // restAPI로 데이터를 가져왔으면 데이터 저장
        if(cDataList.size() > 0){
            saveComponentData(cDataList);
        }

        // Map<String, Object> orgInfoSettingMap = new Map<String, Object>();
        // Map<String, Object> userInfoMap = new Map<String, Object>();
        // ConnectApi.OrganizationSettings orgSettings = ConnectApi.Organization.getSettings();

        // // 설정 -> 회사 정보 -> 필요 정보 저장
        // orgInfoSettingMap.put('CurrencySymbol', orgSettings.UserSettings.currencySymbol);
        // orgInfoSettingMap.put('DefaultCurrencyIsoCode', orgSettings.features.defaultCurrencyIsoCode);

        // // 개인 정보 설정 -> 언어 및 표준 시간대 정보 저장
        // userInfoMap.put('UserLocale', UserInfo.getLocale().split('_')[0]);
        // userInfoMap.put('UserTimeZone', String.valueOf(UserInfo.getTimeZone()));

        // tempMap.put('OrgInfoSetting', orgInfoSettingMap);
        // tempMap.put('UserInfoSetting', userInfoMap);

        Map<String, Object> infoMap = getOrgAndUserInfo();
        tempMap.putAll(infoMap);
    
        resultMap.put('Result', tempMap);
        return resultMap;
    }
    
    // 관련 목록 데이터 세팅
    /*
        parentObjName의 하위 관련 목록 중 childObjName와 일치하는 오브젝트의 데이터만 세팅.
    */
    private static Map<String, Object> setRelatedData(String recordId, String parentObjName, String childObjName, BeforeReferenceField befoRefFld, List<DK_CX_SC__SC_DataRelatedListRestApi__c> cDataList){
        Map<String, Object> resultMap = new Map<String, Object>();
        List<Object> relatedDataList = new List<Object>();
        Map<String, Object> childDataMap = new Map<String, Object>();

        relatedDataList = getRelatedDataList(recordId, parentObjName, childObjName, cDataList);
    
        System.debug('relatedDataList.size >>> ' + relatedDataList.size());
        if(relatedDataList.size() > 0){
            Integer cnt = 0;
            for(Object r : relatedDataList){
                cnt++;
                childDataMap = (Map<String, Object>)r;
                System.debug('childDataMap sobject >>> ' + childDataMap.get('sobject'));
                String sObjectName = String.valueOf(childDataMap.get('sobject'));
                if(sObjectName == childObjName){
                    System.debug('sObjectName == childObjName');
                    resultMap = setRelatedDataMap(recordId, parentObjName, childDataMap, befoRefFld);
                    break;
                } else if(relatedDataList.size() == cnt){
                    resultMap.put('Message', parentObjName + ' 오브젝트에 ' + childObjName + ' 오브젝트가 관련목록으로 있는지 확인해주세요.');
                }
            }
        }

        return resultMap;
    }

    // 관련 목록을 List로 가져오기
    /*
        관련 목록을 처음 불러왔다면 RestAPI로 데이터를 가져오고 오브젝트에 해당 데이터 저장
        처음이 아니라면 오브젝트에서 데이터 가져오기
    */
    private static List<Object> getRelatedDataList(Id recordId, String parentObjName, String childObjName, List<DK_CX_SC__SC_DataRelatedListRestApi__c> cDataList){
        String recordTypeId = getRecordTypeId(recordId, parentObjName); // 레코드 타입 ID 가져오기
        String externalKey = parentObjName + '_' + recordTypeId + '_' + childObjName; // 레코드 objName, 레코드 타입 ID, 컴포넌트 objName으로 키 생성


        // 오브젝트에 기존에 저장한 데이터가 있는지 확인( 해당 데이터가 없을 때만 restAPI 통신 사용 )
        List<DK_CX_SC__SC_DataRelatedListRestApi__c> taRelList = [SELECT ComponentData__c, LastModifiedDate FROM DK_CX_SC__SC_DataRelatedListRestApi__c WHERE ExternalKey__c = :externalKey];
        System.debug('taRelList.size() >>> ' + taRelList.size());
        if(taRelList.size() > 0){
            return (List<Object>)JSON.deserializeUntyped(taRelList[0].ComponentData__c);
        } else {
            Map<String, Object> layout = (Map<String, Object>)JSON.deserializeUntyped(getRelatedLayoutsByRestAPI(recordTypeId, parentObjName));
            List<Object> relatedList = new List<Object>();
            System.debug('layout containsKey >>> ' + layout.containsKey('errorCode'));

            if(layout.containsKey('errorCode')){
                System.debug('errorCode >>> ' + layout.get('errorCode'));
                System.debug('message >>> ' + layout.get('message'));
            } else {
                relatedList = (List<Object>)layout.get('relatedLists');
                cDataList.add(tempSaveComponentData(parentObjName, childObjName, recordTypeId, externalKey, JSON.serializePretty(relatedList)));
            }

            return relatedList;
        }
    }

    // RestAPI로 가져온 데이터 변수에 임시 저장
    private static DK_CX_SC__SC_DataRelatedListRestApi__c tempSaveComponentData(String parentObj, String childObj, String recordTypeId, String extKey, String componentData) {
        DK_CX_SC__SC_DataRelatedListRestApi__c r = new DK_CX_SC__SC_DataRelatedListRestApi__c();
        r.ParentObject__c = parentObj;
        r.ChildObject__c = childObj;
        r.RecordTypeId__c = recordTypeId;
        r.ExternalKey__c = extKey;
        r.ComponentData__c = componentData;
        return r;
    }

    // RestAPI로 가져온 데이터 오브젝트에 저장
    private static void saveComponentData(List<DK_CX_SC__SC_DataRelatedListRestApi__c> cDataList) {
        try {
            upsert cDataList ExternalKey__c;
        } catch (DmlException e) {
            System.debug(e.getMessage());
        }
    }

    // 관련 목록 데이터 Map 형태로 세팅
    /*
        쿼리 시 idField 변수에는 상위 오브젝트를 참조하는 하위 오브젝트의 필드가 대입되어야 한다.
        
        리턴 되는 Map의 키 : 데이터
        ColumnList      : 컴포넌트 하위 오브젝트 필드 정보 List( List<Object> )
        Rows            : 컴포넌트 하위 오브젝트 관련 목록 데이터 List
        Label           : 컴포넌트 하위 오브젝트 관련 목록의 Label
        SObjectName     : 컴포넌트 하위 오브젝트 관련 목록의 ObjectName
        ReferencedField : 컴포넌트 하위 오브젝트에서 상위 오브젝트와 조회 관계에 있는 ID
        TypeMap         : 컴포넌트 하위 오브젝트 필드 타입 Map( 필드 API name(키), 필드 유형(값) )
    */
    @TestVisible
    private static Map<String, Object> setRelatedDataMap(Id recordId, String parentObjName, Map<String, Object> dataMap, BeforeReferenceField befoRefFld){
        Map<String, Object> resultMap = new Map<String, Object>();
        String label = '';
        String name = '';
        String sObjectName = '';
        String field = 'Id';
        List<Object> columnList = new List<Object>();
        List<Object> sortList = new List<Object>();
        String subFields = 'Id';
        String sortingField = '';
        String sortingDirect = '';
        String soql = '';
        String idField = 'Id';
        Map<String, Object> fieldTypeMap = new Map<String, Object>(); // 추후 필요 시 주석 해제

        Boolean checkOnceForEncrypType = false;
        
        label = String.valueOf(dataMap.get('label'));
        name = String.valueOf(dataMap.get('name'));
        sObjectName = String.valueOf(dataMap.get('sobject'));
        columnList = (List<Object>)dataMap.get('columns');
        fieldTypeMap = getFieldTypeMap(sObjectName, columnList); // 필드의 name과 type 가져오기. 추후 필요 시 주석 해제

        
        // OwnerId가 존재하면 field에 추가
        Map<String, Schema.SObjectField> pfm = ((SObject) Type.forName(parentObjName).newInstance()).getSObjectType().getDescribe().fields.getMap();
        for(SObjectField fName : pfm.values()){
            if(String.valueOf(fName) == 'OwnerId'){
                field += ', OwnerId ';
            }
        }

        // 하위 오브젝트의 필드 목록을 subFields 변수에 저장
        for(Object col : columnList) {
            Map<String, Object> colMap = (Map<String, Object>)col;
            String fieldName = String.valueOf(colMap.get('name'));
            subFields += ',' + fieldName;

            // 하위 오브젝트의 필드 목록 중 암호화 필드가 있다면 암호화 필드 보기 권한 체크
            if(checkOnceForEncrypType == false && fieldTypeMap.get(fieldName) == 'ENCRYPTEDSTRING'){
                // true 이면 데이터 표시( 프론트에서 수행 )
                // false 이면 '*****' 표시
                Id profileId = Userinfo.getProfileId();
                Boolean checkPermission = [SELECT Id,Name, PermissionsViewEncryptedData FROM Profile WHERE Id=:profileId].PermissionsViewEncryptedData; 
                resultMap.put('CheckEncryptedDataView', checkPermission);

                checkOnceForEncrypType = true;
            }
        }

        
        // sort 되어있다면 정렬 적용
        sortList = (List<Object>)dataMap.get('sort');
        if(sortList.size() > 0) {
            Map<String, Object> sortMap = (Map<String, Object>)sortList.get(0);
            sortingField = ' order by ' + sortMap.get('column') + ' ';
            sortingDirect = Boolean.valueOf(sortMap.get('ascending')) ? ' ' : 'DESC ';
        }


        // 이전 참조 필드가 존재하면
        if(befoRefFld.fldNm != '' && befoRefFld.fldNm != null){
            idField = befoRefFld.fldNm;
        }
        System.debug('dataMap field >>> ' + String.valueOf(dataMap.get('field')));
        befoRefFld.fldNm = String.valueOf(dataMap.get('field')); // 컴포넌트의 데이터 깊이 2Lv 부터 사용되는 변수

        try {
            // 예) select Id, (select Id from TrainingComplete__r) from GeoObject__c where id = ''
            soql = ' select ' +field+ ', (select ' +subFields+ ' from ' + name + sortingField + sortingDirect + ') from ' +parentObjName+ ' where ' +idField+ '=\'' +recordId+ '\' ';
            System.debug('soql >>> ' + soql);
            resultMap.put('Rows', Database.query(soql));
            resultMap.put('ColumnList', columnList);
            resultMap.put('Label', label);
            resultMap.put('ReferencdObjApiName', name);
            resultMap.put('SObjectName', sObjectName);
            resultMap.put('ReferencedField', befoRefFld.fldNm);
            resultMap.put('TypeMap', fieldTypeMap); // 추후 필요 시 주석 해제
        } catch (QueryException e) {
            System.debug('QueryException ERROR >>>' + e.getMessage());
            resultMap.put('ErrorMessage', e.getMessage());
        }

        return resultMap;
    }

    // 필드의 name과 type 가져오기
    @TestVisible
    private static Map<String, Object> getFieldTypeMap(String objName, List<Object> columnList){
        Map<String, Object> fieldTypeMap = new Map<String, Object>();
        integer cnt = 0;
        for (Object column : columnList) {
            Map<String, Object> fieldInfoMap = (Map<String, Object>)column;
            String field = (String)fieldInfoMap.get('field');
            String fieldApiName = (String)fieldInfoMap.get('fieldApiName');
            String fieldType = getFieldType(objName, fieldApiName); // 필드의 type 가져오기

            // fieldType이 PICKLIST면 PICKLIST 목록을 가져오기
            if(fieldType == 'PICKLIST'){
                Map<String, Object> pickListMap = new Map<String, Object>();

                // 동적 오브젝트, 동적 필드의 선택 목록 가져오기
                String[] tempFieldSplit = field.split('\\.'); // field변수 ex. Account.CustomerPriority__c
                String tempObjOfField = tempFieldSplit.get(0);
                String tempField = tempFieldSplit.get(1);
                Map<String,Schema.SObjectField> sofMap = Schema.getGlobalDescribe().get(tempObjOfField).getDescribe().fields.getMap();
                List<Schema.PicklistEntry> values = sofMap.get(tempField).getDescribe().getPicklistValues();
                for(Schema.PicklistEntry p : values){
                    pickListMap.put(p.getValue(), p.getLabel());
                }
                fieldTypeMap.put(fieldApiName, pickListMap);

            } else {
                fieldTypeMap.put(fieldApiName, fieldType);
            }

            cnt++;
        }

        return fieldTypeMap;
    }

    // 필드의 type 가져오기
    private static String getFieldType(String objName, String fieldName) {
        String fieldType = 'STRING';

        String currentFieldName = fieldName;
        String currentObjName = objName;

        Map<String, Schema.SObjectType> globalObjectMap = Schema.getGlobalDescribe();

        while (true) {
            if (currentFieldName.contains('.')) {
                Integer idx = currentFieldName.indexOf('.');
                String relationName = currentFieldName.substring(0, idx);

                Map<String, Schema.SObjectField> fieldMap = globalObjectMap.get(currentObjName).getDescribe().fields.getMap();
                for (String fieldKey : fieldMap.keySet()) {
                    Schema.DescribeFieldResult fieldInfo = fieldMap.get(fieldKey).getDescribe();

                    if (relationName == fieldInfo.getRelationshipName()) {
                        currentObjName = fieldInfo.getReferenceTo()[0].getDescribe().getName();

                        currentFieldName = currentFieldName.substring(idx+1);
                    }
                }
            } else {
                Map<String, Schema.SObjectField> fieldMap = globalObjectMap.get(currentObjName).getDescribe().fields.getMap();
                for (String fieldKey : fieldMap.keySet()) {
                    Schema.DescribeFieldResult fieldInfo = fieldMap.get(fieldKey).getDescribe();

                    if (currentFieldName == fieldInfo.getName()) {
                        // fieldType = String.valueOf(fieldInfo.getType());
                        if (fieldInfo.isNameField()) {
                            if(currentObjName ==  'RecordType') {
                                fieldType = 'STRING';
                            } else {
                                fieldType = 'NAME';
                            }
                            
                        } else {
                            // fieldType = String.valueOf(fieldInfo.getSOAPType());
                            fieldType = String.valueOf(fieldInfo.getType());
                        }
                    }
                }

                // SOAPType 종류 : anytype, base64binary, Boolean, Date, Datetime, Double, Integer, String, Time
                // 반환값 종류 : NAME, STRING, BOOLEAN, DATE, DATETIME, TIME, NUMBER
                // switch on fieldType {
                //     when 'ANYTYPE', 'BASE64BINARY', 'ID', 'MULTIPICKLIST', 'PICKLIST', 'TEXTAREA' {
                //         fieldType = 'STRING';
                //     }
                //     when 'DOUBLE', 'INTEGER', 'CURRENCY' {
                //         fieldType = 'NUMBER';
                //     }
                // }

                // System.debug('End : ' + currentFieldName + ' / ' + fieldType);
                break;
            }
        }

        return fieldType;
    }

    // restAPI로 관련 목록 가져오기
    /*
        잦은 restAPI 통신은 서버에 성능 저하가 올 수 있다.
    */
    global static String getRelatedLayoutsByRestAPI(String recordTypeId, String objName){
        String sessionId = getSession(); // Session Id 가져오기
        
        Httprequest httpReq = new Httprequest();
        HttpResponse httpRes = new HttpResponse();
        Http http = new Http();
        String resBody = null;
        
        // http 설정
        String endpoint = DomainCreator.getOrgMyDomainHostname(); // ex. dkbmc--pms.sandbox.my.salesforce.com

        System.debug('https://' + endpoint + '/services/data/v59.0/sobjects/' + objName + '/describe/layouts/' + recordTypeId);

        httpReq.setMethod('GET');
        httpReq.setEndpoint('https://' + endpoint + '/services/data/v59.0/sobjects/' + objName + '/describe/layouts/' + recordTypeId);
        httpReq.setTimeout(120000);
        httpReq.setHeader('Authorization', 'Bearer ' + sessionId);
        httpReq.setHeader('charset', 'UTF-8');
        httpReq.setHeader('Content-Type', 'application/json');
        httpReq.setHeader('Accept', 'application/json');

        // http 데이터 받아오기
        if(!Test.isRunningTest()) {
            httpRes = http.send(httpReq);
        } else {
            String blStr= '{"relatedLists":[{"accessLevelRequiredForCreate":null,"buttons":[{"behavior":null,"colors":[{"color":"A094ED","context":"primary","theme":"theme4"}],"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":[{"contentType":"image/svg+xml","height":0,"theme":"theme4","url":"https://dk-lc-dev-ed.my.salesforce.com/img/icon/t4v35/action/new_contact.svg","width":0},{"contentType":"image/png","height":60,"theme":"theme4","url":"https://dk-lc-dev-ed.my.salesforce.com/img/icon/t4v35/action/new_contact_60.png","width":60},{"contentType":"image/png","height":120,"theme":"theme4","url":"https://dk-lc-dev-ed.my.salesforce.com/img/icon/t4v35/action/new_contact_120.png","width":120}],"label":"New","menubar":false,"name":"NewContact","overridden":false,"resizeable":false,"scrollbars":false,"showsLocation":false,"showsStatus":false,"toolbar":false,"url":null,"width":null,"windowPosition":null},{"behavior":null,"colors":null,"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":null,"label":"Get More Contacts","menubar":false,"name":"DataDotComGetContactsMultiAddAction","overridden":false,"resizeable":false,"scrollbars":false,"showsLocation":false,"showsStatus":false,"toolbar":false,"url":null,"width":null,"windowPosition":null},{"behavior":null,"colors":null,"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":null,"label":"Merge Contacts","menubar":false,"name":"Merge","overridden":false,"resizeable":false,"scrollbars":false,"showsLocation":false,"showsStatus":false,"toolbar":false,"url":null,"width":null,"windowPosition":null},{"behavior":null,"colors":null,"content":null,"contentSource":null,"custom":false,"encoding":null,"height":null,"icons":null,"label":"Add to Campaign","menubar":false,"name":"MassAddToCampaign","overridden":false,"resizeable":false,"scrollbars":false,"showsLocation":false,"showsStatus":false,"toolbar":false,"url":null,"width":null,"windowPosition":null}],"columns":[{"field":"Contact.Name","fieldApiName":"Name","format":null,"label":"Contact Name","lookupId":"Id","name":"Name","sortable":true},{"field":"Contact.Title","fieldApiName":"Title","format":null,"label":"Title","lookupId":null,"name":"Title","sortable":true},{"field":"Contact.Email","fieldApiName":"Email","format":null,"label":"Email","lookupId":null,"name":"Email","sortable":true},{"field":"Contact.Phone","fieldApiName":"Phone","format":null,"label":"Phone","lookupId":null,"name":"Phone","sortable":true}],"custom":false,"field":"AccountId","label":"Contacts","limitRows":5,"name":"Contacts","sobject":"Contact","sort":[{"ascending":true,"column":"LastName"}]}]}';
            Blob bl = Blob.valueof(blStr);
            httpRes.setBody(blStr);
            httpRes.setStatusCode(200);
        }        
        
        resBody = httpRes.getBody();
        if(resBody.substring(0, 1) == '[') resBody = resBody.substring(1, resBody.length() -1); // 오류 발생 시 배열로 결과를 받아오기 때문에 괄호를 지워주기
        System.debug('** getRelatedListLayout resBody : ' + resBody);

        return resBody;
    }

    // Session Id 가져오기
    @AuraEnabled
    global static String getSession(){
        if(Test.isRunningTest()) {
            return 'SESSION_ID';
        } else {
            String pageContent = Page.DK_SessionIdFromVFPage.getContent().toString();
            Integer startIndex = pageContent.indexOf('SESSION_ID_START') + 'SESSION_ID_START'.length();
            Integer endIndex = pageContent.indexOf('SESSION_ID_END');
            return pageContent.substring(startIndex, endIndex);
        }
    }

    // 레코드 타입 ID 가져오기
    /*
        오브젝트에 레코드 타입이 존재하는 경우 해당 레코드 타입을 가져오기 위함.
        레코드 타입이 없다면 기본 값인 레코드 타입의 마스터 ID를 사용.( 012000000000000AAA )
    */
    private static String getRecordTypeId(Id recordId, String objName) {
        String recordTypeId = '';
        System.debug('getRecordTypeId : ' + recordId + ' : ' + objName);
        
        List<RecordType> rtList = [SELECT Id FROM RecordType WHERE SobjectType = :objName];
        
        System.debug('rtList.size() : ' + rtList.size());
        // 해당 오브젝트의 레코드 타입이 존재하는 경우
        if(rtList.size() > 0) {
            System.debug('getRecordTypeId query >>> select RecordTypeId from ' + objName + ' where Id = :recordId');
            Sobject sObj = (Sobject)Database.query('select RecordTypeId from ' + objName + ' where Id = :recordId').get(0);
            recordTypeId = String.valueOf(sObj.get('RecordTypeId'));
        // 레코드 타입이 존재하지 않을 경우 마스터 레코드 타입
        } else {
            recordTypeId = '012000000000000AAA';
        }
            
        return recordTypeId;
    }

    // 레코드 삭제
    @AuraEnabled
    global static Map<String, Object> deleteRecord(String recordIdList){
        Map<String, Object> resultMap = new Map<String, Object>();
        recordIdList = recordIdList.replaceAll('[\\[\\]\'\" ]', ''); // 괄호와 작은 따옴표, 큰 따옴표 제거
        List<String> idList = new List<String>(recordIdList.split(','));
        String idListToString = '\'' + String.join(idList, '\', \'') + '\'';

        String objName = Id.valueOf(idList.get(0)).getSObjectType().getDescribe().getName();
        String soql = ' SELECT Id FROM ' +objName+ ' WHERE Id IN(' +idListToString+ ') ';
        List<sObject> queryResult = Database.query(soql);

        try {
            if(queryResult.size() > 0){
                delete queryResult;
            }
            resultMap.put('Result', true);
            resultMap.put('Count', queryResult.size());
        } catch (DmlException e) {
            resultMap.put('Result', false);
            resultMap.put('Count', -1);
            resultMap.put('error', e);
        }
        return resultMap;
    }


    // 사용자 목록 검색하기
    @AuraEnabled(cacheable=true)
    global static List<User> findUsers(String searchTerm) {
        if (String.isBlank(searchTerm)) {
            return [SELECT Id, Name, Title, Email FROM User WHERE isActive = true LIMIT 10];
        } else {
            searchTerm = '%' + searchTerm + '%';
            return [SELECT Id, Name, Title, Email FROM User WHERE (Name LIKE :searchTerm) AND isActive = true LIMIT 10];

        }
    }

    @AuraEnabled
    public static String updateData(String jsonData, String objectName) {
        try {
            List<UpdatedRow> updatedRows = (List<UpdatedRow>) JSON.deserialize(jsonData, List<UpdatedRow>.class);
            SObjectType sobjectType = getSObjectType(objectName);
            Map<String, SObjectField> fieldsMap = sobjectType.getDescribe().fields.getMap();

            System.debug('sobjectType: ' + sobjectType);
            System.debug('fieldsMap: ' + fieldsMap);

            List<SObject> objectsToUpdate = new List<SObject>();
            for (UpdatedRow row : updatedRows) {
                SObject obj = sobjectType.newSObject();
                obj.put('Id', row.id);
                populateFields(obj, row.values, fieldsMap);
                objectsToUpdate.add(obj);
            }
            update objectsToUpdate; 
            return 'Success';
        } catch (Exception e) {
            System.debug('Error in updateData: ' + e.getMessage());
            return 'Error: ' + e.getMessage();
        }
    }
    
    private static SObjectType getSObjectType(String objectName) {
        SObjectType sobjectType = Schema.getGlobalDescribe().get(objectName);
        if(sobjectType == null) {
            throw new IllegalArgumentException('Invalid object name: ' + objectName);
        }
        return sobjectType;
    }
    
    private static void populateFields(SObject obj, Map<String, String> values, Map<String, SObjectField> fieldsMap) {
        for (String field : values.keySet()) {
            try {
                if(fieldsMap.containsKey(field)) {
                    DescribeFieldResult fieldDescribe = fieldsMap.get(field).getDescribe();
    
                    // 편집 가능한 필드인지 확인
                    if(fieldDescribe.isUpdateable()) { 
                        Object convertedValue = convertFieldValue(values.get(field), fieldDescribe);
                        obj.put(field, convertedValue);
                    } else {
                        System.debug('>>>>>>>> 편집 불가능한 필드 이름 : ' + field);
                    }
                } else {
                    System.debug('필드X 이름 확인 : ' + field);
                }
            } catch (Exception e) {
                System.debug('Error populateFields : ' + field + ' message : ' + e.getMessage());
                throw e;
            }
        }
    }

    // 조건 수정해야함..
    private static Object convertFieldValue(String fieldValue, DescribeFieldResult fieldDescribe) {
        DisplayType fieldType = fieldDescribe.getType();
        System.debug('현재 필드 밸류: ' + fieldValue);
        System.debug('현재 필드 타입: ' + fieldType);
        try {
            if (String.isBlank(fieldValue)) {
                return null; 
            }

            if (fieldType == DisplayType.INTEGER) {
                return Integer.valueOf(fieldValue);
            } else if (fieldType == DisplayType.DOUBLE || fieldType == DisplayType.CURRENCY || fieldType == DisplayType.PERCENT) {
                return Decimal.valueOf(fieldValue);
            } else if (fieldType == DisplayType.BOOLEAN) {
                return Boolean.valueOf(fieldValue);
            } else if (fieldType == DisplayType.DATE) {
                return Date.valueOf(fieldValue);
            } else if (fieldType == DisplayType.DATETIME) {
                return DateTime.valueOf(fieldValue);
            } else {
                return fieldValue; // 기본적으로 문자열로 반환
            }
        } catch (Exception e) {
            System.debug('Data conversion 실패 :  ' + fieldDescribe.getName() + ': ' + fieldValue);
            throw e;
        }
    }
    
    @AuraEnabled(cacheable=true)
    public static Map<String, List<String>> getReadonlyFields(String objLv1, String objLv2) {
        System.debug('getReadonlyFields >>> 진입');
        Map<String, List<String>> readonlyFieldsMap = new Map<String, List<String>>();

        List<String> objectNames = new List<String>{objLv1, objLv2};
        Map<String, Schema.SObjectType> globalDescribe = Schema.getGlobalDescribe(); 

        for (String objectName : objectNames) {
            Schema.SObjectType sObjectType = globalDescribe.get(objectName);
            if(sObjectType == null) {
                System.debug('Object not found: ' + objectName);
                readonlyFieldsMap.put(objectName, new List<String>());
                continue;
            }
        
            Schema.DescribeSObjectResult sObjectDescribe = sObjectType.getDescribe();
            Map<String, Schema.SObjectField> fieldMap = sObjectDescribe.fields.getMap();
        
            List<String> readonlyFields = new List<String>();
            for (String fieldName : fieldMap.keySet()) {
                Schema.DescribeFieldResult fieldDescribe = fieldMap.get(fieldName).getDescribe();
                if (!fieldDescribe.isUpdateable() && fieldDescribe.isAccessible()) {
                    readonlyFields.add(fieldName);
                }
            }
            // 수정 방지 원하는 필드 API 여기다가 추가
            if (objectName.equals(objLv1) || objectName.equals(objLv2)) {
                readonlyFields.add('Owner.Name');
            }

            System.debug('Readonly fields for ' + objectName + ': ' + readonlyFields);
            readonlyFieldsMap.put(objectName, readonlyFields);
        }

        return readonlyFieldsMap;
    }

    @AuraEnabled
    global static Map<String, Object> changeOwner(String recordIdList, String newOwnerId){
        Map<String, Object> resultMap = new Map<String, Object>();
        recordIdList = recordIdList.replaceAll('[\\[\\]\'\" ]', ''); // 괄호와 작은 따옴표, 큰 따옴표 제거
        List<String> idList = new List<String>(recordIdList.split(','));

        String objName = Id.valueOf(idList.get(0)).getSObjectType().getDescribe().getName();
        String idListToString = '\'' + String.join(idList, '\', \'') + '\'';
        String soql = ' SELECT Id, OwnerId FROM ' +objName+ ' WHERE Id IN(' +idListToString+ ') ';
        List<SObject> queryResult = Database.query(soql);

        try {
            if(queryResult.size() > 0){
                List<SObject> tempSObject = new List<SObject>();
                for(SObject o : queryResult){
                    o.put('OwnerId', newOwnerId);
                }
                update queryResult;
            }
            
            resultMap.put('Result', true);
            resultMap.put('Count', queryResult.size());
        } catch (DmlException e) {
            resultMap.put('Result', false);
            resultMap.put('Count', -1);
        }
        return resultMap;
    }

    @AuraEnabled(cacheable=true)
    global static Map<String, Object> getRowDataById(Id recordId) {
        Map<String, Object> result = new Map<String, Object>();
    
        String objName = recordId.getSObjectType().getDescribe().getName();
        String soql = ' SELECT Id FROM ' +objName+ ' WHERE Id = :recordId ';
        try {
            Object o = Database.query(soql);
            result.put('Result', o);
        } catch (DmlException e) {
            result.put('Message', e.getMessage());
        }
        return result;
    }

    @AuraEnabled(cacheable=true)
    public static Boolean isUserInAllowedProfiles(List<String> allowedProfile) {
        System.debug('프로필 라이센스 >>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + allowedProfile);
        
        // 현재 사용자의 프로파일 이름을 가져옵니다.
        String currentUserProfile = [SELECT Name FROM Profile WHERE Id = :UserInfo.getProfileId()].Name;
        
        System.debug('프로필 라이센스 currentUserProfile >>>>>>>>>>>>>>>>>>>>>>>>>>>>>' + currentUserProfile);
        
        // allowedProfile이 단일 문자열로 들어왔을 경우 분리
        if (allowedProfile.size() == 1 && allowedProfile[0].contains(',')) {
            allowedProfile = allowedProfile[0].split(',');
        }
        
        // 정확히 일치하는지 확인합니다.
        for (String profile : allowedProfile) {
            String trimmedProfile = profile.trim(); // 앞뒤 공백 제거
            System.debug('비교 중: 현재 프로필 [' + currentUserProfile + '] vs 허용된 프로필 [' + trimmedProfile + ']');
            
            if (currentUserProfile.equals(trimmedProfile)) {
                System.debug('프로필 라이센스 result >>>>>>>>>>>>>>>>>>>>>>>>>>>true');
                return true;
            }
        }

        System.debug('프로필 라이센스 result >>>>>>>>>>>>>>>>>>>>>>>>>>>false');
        return false;
    }


    public class UpdatedRow {
        public String id;
        public Map<String, String> values;
    }
}