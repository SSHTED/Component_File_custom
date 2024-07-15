import { LightningElement, wire, api } from 'lwc';
import { getObjectInfo } from 'lightning/uiObjectInfoApi';
import getInit from '@salesforce/apex/SC_DataRelatedListController.getInit';
import getData from '@salesforce/apex/SC_DataRelatedListController.getData';
import deleteRecord from '@salesforce/apex/SC_DataRelatedListController.deleteRecord';
import findUsers from '@salesforce/apex/SC_DataRelatedListController.findUsers';
import changeOwner from '@salesforce/apex/SC_DataRelatedListController.changeOwner';
import updateData from '@salesforce/apex/SC_DataRelatedListController.updateData';
import getReadonlyFields from '@salesforce/apex/SC_DataRelatedListController.getReadonlyFields';
import executeBatch from '@salesforce/apex/SC_DataRelatedListManualController.BatchManualExecute';
import modalImages from "@salesforce/resourceUrl/modal_img";
import isUserInAllowedProfiles from '@salesforce/apex/SC_DataRelatedListController.isUserInAllowedProfiles';

import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { NavigationMixin } from 'lightning/navigation';
import { encodeDefaultFieldValues } from "lightning/pageReferenceUtils";


export default class scDataRelatedList extends NavigationMixin(LightningElement) {
    isDebug = true;
    //  실제사용    |      초기화용       | 서버에서 가져온 모든 데이터
    MyData = []; originalMyData = []; fullMyData = [];
    Lv1Columns = []; Lv2Columns = [];
    recordTypeOptions = [];
    users = [];
    readonlyFields = [];
    typePicklistOptions = [];
    typeMaps = {};
    selectedOwnerId; selectedRecordTypeId;
    Lv1ReferencedField;
    Lv1ReferencdObjApiName; Lv2ReferencdObjApiName;
    Lv1SObjectName; Lv2SObjectName;
    tileBoxWidth;
    currencyType; excelDownType;
    userLocale; userTimeZone;
    modalImage1; modalImage2;

    @api recordId; @api recordTypeId; @api objectApiName;
    @api related1Lv; @api related2Lv;
    @api Lv1Icon; @api Lv2Icon;
    @api Lv1Title; @api Lv2Title;
    @api viewType;
    @api themeColor;
    @api buttonType;
    @api activationCreateBtn; @api activationSelectedDeleteBtn;
    @api activationNo; @api activationCheckedFields;
    @api activationSearch; @api activationEditMode;
    @api downloadBtn; @api changeOwnerBtn;
    @api setFieldCount; @api setMaxRow;
    @api sectionFirstOpen;
    // @api manualUpdateBtn;
    @api manualUpdateAllowedProfiles;
    @api sumFirstObj; @api sumSecondObj;
    sumObj = {};
    sumResultFirst = {};
    sumResultSecond = {};
    calculSumData = {};

    navigationType = 'standard__objectPage';
    selectRecordName = '레코드 유형 선택'
    searchOwnerKey = '';
    inputOwnerValue = '';
    inputSearchValue = '';
    activationCheckedFields = '';
    customClass = '';
    firstRenderErrMsg = '';
    nothingSearchMsg = '';
    isExpandDataTable = false;
    isSearchUserName = false;
    selectAllChecked = false;
    isTableVisible = true;
    isCreateRecordModalOpen = false;
    isChangeOwnerModalOpen = false;
    isChecked = false;
    isExcelModalOpen = false;
    isTableEditing = false;
    isEditable = false;
    isLogicExecuted = false;
    btnGroupType = false;
    isVisibleActionBtn = true;
    isFilter = false;
    isReadOnly = false;
    isSum = false;
    isSumFirst = false;
    isSumSecond = false;
    isNotChildObj = false;
    checkEncryptedDataView = false;
    isHistory = false;
    isAllowedProfiles = false;

    // 이거도 추가한검당
    isBlankTh = false;


    connectedCallback() {
        if (this.activationSelectedDeleteBtn || this.changeOwnerBtn) {
            this.activationCheckedFields = true;
        }
        if (!this.activationCreateBtn && !this.activationSelectedDeleteBtn && !this.downloadBtn && !this.changeOwnerBtn) {
            this.isVisibleActionBtn = false;
        }
        this.isTableVisible = this.sectionFirstOpen;

        if (this.themeColor) {
            this.customClass += 'article themeColor_' + this.themeColor;
            console.log("커스텀 클래스 이름은 " + this.customClass);
        }

        // static resource 경로 설정
        let modalimgUrl = modalImages;

        this.modalImage1 = modalimgUrl + '/modal_image1.png';
        this.modalImage2 = modalimgUrl + '/modal_image2.png';

        if(!this.activationNo) {
            this.isBlankTh = true;
        }
    }

    renderedCallback() {
        this.checkAndUpdateRelated1Lv();
        if (!this.isLogicExecuted) {
            this.initializeTileBoxWidth();
        }

        console.log('aaaa> ', this.isHistory)
        console.log('manualUpdateAllowedProfiles   > ', this.manualUpdateAllowedProfiles)

        this.adjustTileBoxWidth();
        window.addEventListener('resize', this.adjustTileBoxWidth);
    }

    disconnectedCallback() {
        window.removeEventListener('resize', this.adjustTileBoxWidth);
    }

    adjustTileBoxWidth = () => {
        const tileBoxes = this.template.querySelectorAll('lightning-layout-item');
        const mainDataTile = this.template.querySelector('.mainData_Tile');

        if (!mainDataTile) {
            return;
        }

        const mainDataTileWidth = mainDataTile.offsetWidth;

        let newWidth;
        if (mainDataTileWidth >= 1200) {
            newWidth = '25%';
        } else if (mainDataTileWidth >= 768 && mainDataTileWidth < 1200) {
            newWidth = '50%';
        } else {
            newWidth = '100%';
        }

        tileBoxes.forEach(tileBox => {
            tileBox.style.width = newWidth;
        });
    }
    
    @wire(isUserInAllowedProfiles, { allowedProfile: '$manualUpdateAllowedProfiles'})
    wiredProfileCheck({error, data}){
        if(data){
            console.log('wiredProfileCheck data:' , data);
            this.isAllowedProfiles = data;
            console.log('wiredProfileCheck this.isAllowedProfiles:' , this.isAllowedProfiles);

        }else if(error){
            console.error('프로필 라이센스 호출 에러: ', error);
            console.error('프로필 라이센스 호출 에러: ', error.message);
        }
    }
    

    checkAndUpdateRelated1Lv() {
        if (this.related1Lv && typeof this.related1Lv === 'string') {
            const lowerCaseValue = this.related1Lv.toLowerCase();
            if (lowerCaseValue.endsWith('history')) {
                this.isHistory = true;
            }
        }
    }
    
    initializeTileBoxWidth() {
        if(this.buttonType == 'button') {
            this.btnGroupType = true;
        }

        let tileElement = this.template.querySelector('.mainData_Tile');
        let listElement = this.template.querySelector('.mainData_List');
        
        if (tileElement || listElement) {
            this.setTileBoxWidth(tileElement, listElement);
            this.isLogicExecuted = true;
        }
    }
    
    setTileBoxWidth(tileElement, listElement) {
        this.tileBoxWidth = tileElement ? tileElement.offsetWidth : listElement.offsetWidth;
    }

    executeBatch(event) {
        // onlick 이벤트 지우기
        event.target.className = 'pointerEventNone';

        let obj = {
            recordTypeId: this.recordTypeId
            , objNameList: [this.objectApiName, this.related1Lv]
        };

        executeBatch({ paramMap: JSON.stringify(obj) })
            .then(() => {
                this.showToast('필드 업데이트 시작', '필드 업데이트 배치를 시작합니다. 업데이트가 끝나면 알람을 확인해주세요. 새로고침 하기 전까지 업데이트 버튼을 클릭할 수 없습니다.', 'success');
            })
            .catch(error => {
                if (this.isDebug) { console.error('Error executing batch: ' + JSON.stringify(error)); }
            });
    }

    // 레코드 타입 데이터 가져오기
    @wire(getObjectInfo, { objectApiName: '$related1Lv' })
    wiredObjectInfo({ error, data }) {
        if (this.shouldFetchObjectInfo) {
            if (data) {
                this.recordTypeOptions = Object.values(data.recordTypeInfos)
                    .filter(rt => rt.available && !rt.master)
                    .map(rt => ({ label: rt.name, value: rt.recordTypeId }));

                //Default 설정
                if (this.recordTypeOptions.length > 0) {
                    this.selectedRecordTypeId = this.recordTypeOptions[0].value;
                }
                this.logSetting('this.selectedRecordTypeId : ', this.selectedRecordTypeId);
            } else if (error) {
                this.handleError(error);
            }
        } else {
            // History 객체인 경우 recordTypeOptions를 빈 배열로 설정
            this.recordTypeOptions = [];
            this.selectedRecordTypeId = null;
            this.logSetting('History object detected, skipping record type fetch');
        }
    }

    @wire(getReadonlyFields, { objLv1: '$related1Lv', objLv2: '$getRelated2Lv' })
    wiredGetReadonlyFields({ error, data }) {
        if (data) {
            this.readonlyFieldsLv1 = data[this.related1Lv];
            this.readonlyFieldsLv2 = data[this.related2Lv];
        } else if (error) {
            this.handleError(error);
        }

        this.logSetting('읽기 전용 필드 1', this.readonlyFieldsLv1)
        this.logSetting('읽기 전용 필드 2', this.readonlyFieldsLv2)
    }

    @wire(getInit, { recordId: '$recordId', parentObjName: '$related1Lv', componentObjName: '$getRelated2Lv' })
    wiredInit({ error, data }) {
        console.log('recordId :', this.recordId, ', parentObjName :', this.related1Lv, ', componentObjName :', this.related2Lv)
        if (data) {
            const dResult = data.Result;
            if (this.isDebug) { console.log('getData 변수 : ', dResult) }

            // TODO 숫자 필드 계산
            if ((this.sumFirstObj != null && this.sumFirstObj != '') || (this.sumSecondObj != null && this.sumSecondObj)) {
                this.sumObj = { // ex. sumFirstObj: {"objName":"Contact", "fieldName":"NumberTest__c", "fieldLabel":"숫자테스트"}
                    sumFirstObj: this.sumFirstObj
                    , sumSecondObj: this.sumSecondObj // ex. {"objName":"Opportunity", "fieldName":"OpNumberTest__c", "fieldLabel":"기회숫자테스트"}
                }
            }

            getData({ recordId: dResult.RecordId, parentObjName: dResult.ParentObjName, componentObjName: dResult.ComponentObjName, sumObj: JSON.stringify(this.sumObj) })
                .then(result => {
                    if (this.isDebug) {
                        console.log('✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔ 렌더링 완료 ✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔✔')
                        console.log('All Data : ', result)
                    }
                    this.settingErrorMsg(result.Result);
                    this.processData(result.Result);


                })

                .catch(error => {
                    this.handleError(error);
                });
        }
    }

    processData(data) {
        if (!data || Object.keys(data).length === 0) {
            this.showToast('유효하지 않은 오브젝트', '오브젝트를 확인해주세요.', 'warning');
            return;
        }
        this.processOrgInfoSet(data);

        this.setupLv1Data(data['1Lv']);
        if (data['2Lv']) {
            this.setupLv2Data(data['2Lv']);
        } else {
            this.clearLv2Data();
        }

        const Lv1DataRow = data['1Lv'].Rows[0][this.Lv1ReferencdObjApiName] || [];
        const Lv2DataRows = data['2Lv'] && data['2Lv'].Rows ? data['2Lv'].Rows : [];
        const Lv2RelatedObjApiName = data['2Lv'] ? this.Lv2ReferencdObjApiName : null;
        const Lv1AndLv2typeMaps = this.typeMaps;
        this.logSetting('Lv1AndLv2typeMaps : ', Lv1AndLv2typeMaps);

        // 공통 데이터 
        this.fullMyData = this.getRows(Lv1DataRow, Lv2DataRows, Lv2RelatedObjApiName, Lv1AndLv2typeMaps);
        this.logSetting('처음 렌더링 fullMyData : ', this.fullMyData);

        this.finalSetupData(data);
        this.logSetting('처음 렌더링 MyData : ', this.MyData);
    }

    setupLv1Data(lv1Data) {
        this.Lv1ReferencedField = lv1Data.ReferencedField;
        this.Lv1ReferencdObjApiName = lv1Data.ReferencdObjApiName;
        this.Lv1SObjectName = lv1Data.SObjectName;
        this.Lv1Columns = this.getColumns(lv1Data.ColumnList);
        this.Lv1TitleUrl = this.getUrl(this.objectApiName, this.recordId, this.Lv1ReferencdObjApiName);
        this.Lv1Title = this.setDefaultOrValue(this.Lv1Title, lv1Data.Label);
        this.Lv1Icon = this.setDefaultOrValue(this.Lv1Icon, "standard:record");
        this.typeMaps.Lv1TypeMap = lv1Data.TypeMap;
    }

    setupLv2Data(lv2Data) {
        this.Lv2ReferencdObjApiName = lv2Data.ReferencdObjApiName;
        this.Lv2SObjectName = lv2Data.SObjectName;
        this.Lv2Columns = this.getColumns(lv2Data.ColumnList);
        this.Lv2CountAll = this.calculateLv2CountAll(lv2Data.Rows, lv2Data.ReferencdObjApiName);
        this.Lv2Title = this.setDefaultOrValue(this.Lv2Title, lv2Data.Label);
        this.Lv2Icon = this.setDefaultOrValue(this.Lv2Icon, "utility:relate");
        this.typeMaps.Lv2TypeMap = lv2Data.TypeMap;
    }

    clearLv2Data() {
        this.Lv2ReferencdObjApiName = null;
        this.Lv2CountAll = 0;
    }

    finalSetupData(data) {
        if (this.setMaxRow) {
            this.MyData = this.fullMyData.slice(0, this.setMaxRow);
        } else {
            this.MyData = [...this.fullMyData];
        }
        this.originalMyData = [...this.MyData];

        this.MyData.forEach(row => {
            row.Lv2Count = this.calculate2LvCount(row.Lv2ClientData);
            row.Lv2ObjectUrl = this.getUrl(this.related1Lv, row.Id, this.Lv2ReferencdObjApiName);
        });
    }

    processOrgInfoSet(data) {
        this.currencyType = data['OrgInfoSetting'].CurrencySymbol;
        this.currencyIsoCode = data['OrgInfoSetting'].DefaultCurrencyIsoCode;

        this.userLocale = data['UserInfoSetting'].UserLocale;
        this.userTimeZone = data['UserInfoSetting'].UserTimeZone;

        this.checkEncryptedDataView = data['CheckEncryptedDataView'] == true ? true : false; // 암호화 필드 보기 권한 체크

        var OrgInfoSet = `CurrencyType: ${this.currencyType}, currencyIsoCode: ${this.currencyIsoCode}, UserLocale: ${this.userLocale}, UserTimeZone: ${this.userTimeZone}`;
        this.logSetting('오그 유저 정보  : ', OrgInfoSet);
    }

    getColumns(colList) {
        if (this.setFieldCount) {
            return colList.slice(0, this.setFieldCount).map(col => ({ label: col.label, fieldName: col.fieldApiName }));
        } else {
            return colList.map(col => ({ label: col.label, fieldName: col.fieldApiName }));
        }
    }

    getRows(Lv1DataRow, Lv2DataRows, Lv2RelatedObjApiName, Lv1AndLv2typeMaps) {
        let allLv2RowIds = [];
        // 각 레벨1의 해당하는 레벨2 데이터 매핑
        const level2DataMap = this.createLevel2DataMap(Lv2DataRows, Lv2RelatedObjApiName);

        let createingData = Lv1DataRow.map((row, index) => {
            let Lv1ClientData = this.processLevel1Data(row, index, this.Lv1Columns, Lv1AndLv2typeMaps.Lv1TypeMap);
            let Lv2ClientData = this.processLevel2Data(row, index, this.Lv2Columns, level2DataMap, Lv1AndLv2typeMaps.Lv2TypeMap);

            // Lv2ClientData의 각 행의 id 추출
            let lv2RowIds = Lv2ClientData.map(lv2DataArray => {
                return lv2DataArray.length > 0 ? { id: lv2DataArray[0].id } : {};
            });
            // let Lv2RowIds = Lv2ClientData.flatMap(lv2DataArray => lv2DataArray.map(lv2Row => lv2Row.id));

            console.log('lv2RowIds >>>>>>>>>>>>>>>> ', JSON.stringify(lv2RowIds, null, 2))



            return {
                // ...row,
                Id: row.Id,
                Lv1ClientData: Lv1ClientData,
                Lv2ClientData: Lv2ClientData,
                Lv2RowIds: lv2RowIds,
                index: index + 1
            };
        });

        return createingData;
    }

    processLevel1Data(row, index, Lv1Columns, Lv1TypeMap) {
        return this.processLevelDataReturn(row, index, Lv1Columns, Lv1TypeMap, this.related1Lv);
    }

    processLevel2Data(row, index, Lv2Columns, level2DataMap, Lv2TypeMap) {
        let Lv2DataRows = level2DataMap.get(row.Id) || [];

        return Lv2DataRows.map((lv2Row, lv2Index) => {
            let processedRow = this.processLevelDataReturn(lv2Row, index, Lv2Columns, Lv2TypeMap, this.related2Lv);

            processedRow.push(this.setDefaultEmptyObj(lv2Row.Id));

            processedRow.index = lv2Index + 1;

            return processedRow;
        });
    }

    //레벨 1, 2 전부 setFieldCount에 영향 받음
    processLevelDataReturn(row, index, columns, typeMap, relatedLv) {
        const filteredColumns = columns.filter(col => this.filterColumns(col.fieldName));
        const totalColumnsCount = filteredColumns.length;

        return filteredColumns.map((col, colIndex) => {
            return this.processLevelDataSet(row, col.fieldName, typeMap, relatedLv, index, colIndex, col.label, totalColumnsCount);
        }).slice(0, this.setFieldCount);
    }

    filterColumns(fieldName) {
        var result = fieldName !== 'FirstName';
        return result;
    }

    processLevelDataSet(row, fieldName, typeMap, relatedLv, index, colIndex, label, totalColumnsCount) {
        index = index + 1;
        const url = fieldName === 'Name' ? this.getUrl(relatedLv, row.Id) : null;
        const cellType = this.getCellInputType(fieldName, typeMap);
        const compactedValue = this.compactValue(row, fieldName, cellType);

        console.log('compactedValue', JSON.stringify(compactedValue, null, 2));

        //상위 오브젝트 Id
        const referencedObjKey = Object.keys(row)[0];
        const referencedObjValue = row[referencedObjKey];

        return {
            index: index,
            referencedObjId: referencedObjValue,
            id: row.Id,
            key: relatedLv + '-' + fieldName + '-' + index + '-' + colIndex + '-' + row.Id,
            objName: relatedLv,
            label: label,
            fieldApiName: fieldName,
            value: compactedValue.value,
            url: url,
            inputType: cellType.type,
            picklistOptions: cellType.options,
            isReadOnly: cellType.isReadOnly,
            isCheckbox: compactedValue.isChecked,
            isCurrency: cellType.tpye === 'currency',
            isPicklist: Array.isArray(cellType.options) && cellType.options.length > 0,
            // isLastColumn: colIndex === totalColumnsCount - 1,
            isLastColumn: false,
            isDatetimeLocal: cellType.isDatetimeLocal,
            isDate: cellType.isDate,
            isCreateddate: cellType.isCreateddate,
            isLastmodifieddate: cellType.isLastmodifieddate
        };
    }

    setDefaultEmptyObj(rowId) {
        return {
            index: '',
            referencedObjId: '',
            id: rowId,
            key: '',
            objName: '',
            label: '',
            fieldApiName: '',
            value: '',
            url: '',
            inputType: '',
            picklistOptions: '',
            isReadOnly: false,
            isCheckbox: false,
            isCurrency: false,
            isPicklist: false,
            isLastColumn: true,
            isDatetimeLocal: false,
            isDate: false
        };
    }

    toggleLv2data(event) {
        const rowId = event.currentTarget.dataset.id;
        const index = this.MyData.findIndex(row => row.Id === rowId);

        if (this.checkTogglePrevent(event)) { return; }

        if (index !== -1) {
            this.MyData[index].showDetails = !this.MyData[index].showDetails;
            this.isExpandDataTable = this.MyData.some(item => item.showDetails);
        } else {
            if (this.isDebug) { console.log('해당 Id를 가진 행을 찾을 수 없음'); }
        }

        this.MyData = [...this.MyData];
        this.logSetting('MyData [' + [index] + '] Level 2 Data:', this.MyData[index].Lv2ClientData);
    }

    checkTogglePrevent(event) {
        return (
            (
                event.target.type === 'checkbox' ||
                event.target.tagName === 'LIGHTNING-BUTTON-MENU' ||
                event.target.classList.contains('name-link') ||
                event.target.tagName === 'INPUT'
            ) ||
            (
                event.target.tagName === 'LIGHTNING-MENU-ITEM' &&
                (event.target.value === 'edit' || event.target.value === 'delete')
            )
        );
    }

    handleCellEvent(event) {
        event.stopPropagation();

        const actionName = this.getActionNameFromEvent(event);
        let rowId = this.getRowIdFromEvent(event, actionName);
        if (this.isDebug) { console.log(' action name : ', actionName), console.log(' rowid : ', rowId) }

        if (this.isCheckActionLevel(actionName)) {
            this.handleLevel2Action(actionName, rowId);
        } else {
            this.handleLevel1Action(actionName, rowId);
        }
    }

    handleLevel1Action(actionName, rowId) {
        switch (actionName) {
            case 'new':
                this.handleNewAction();
                break;
            case 'edit':
                this.navigateToCrudPage(this.navigationType, this.related1Lv, actionName, rowId);
                break;
            case 'delete':
                this.handleDeleteAction(rowId);
                break;
            case 'excel':
                this.isExcelModalOpen = true;
                break;
            case 'parent_excel':
                this.downloadExcel('parent');
                this.closeExcelModal();
                this.excelDownType = '';
                break;
            case 'parent_child_excel':
                this.downloadExcel('parent_child');
                this.closeExcelModal();
                this.excelDownType = '';
                break;
            case 'changeOwner':
                this.handleOwnerChangeModal();
                break;
            default:
            //
        }
    }

    handleLevel2Action(actionName, rowId) {
        if (actionName === 'DetailEdit') {
            if (this.isDebug) { console.log('Action: DetailEdit', 'Row ID:', rowId); }
            this.navigateToCrudPage(this.navigationType, this.related2Lv, 'edit', rowId);
        } else if (actionName === 'DetailDelete') {
            if (this.isDebug) { console.log('Action: DetailDelete', 'Row ID:', rowId) }
            this.deleteSelectedRecord(rowId);
        }
    }

    //레코드 타입 유무 구분
    handleNewAction() {
        if (this.recordTypeOptions && this.recordTypeOptions.length > 0) {
            this.handleCreateRecordModal();
        } else {
            this.navigateToCrudPage(this.navigationType, this.related1Lv, 'new', null, this.recordId);
        }
    }

    navigateToCrudPage(navigationType, related1Lv, actionName, recordId = null, defaultOrgId = null) {
        let navParams = {
            type: navigationType,
            attributes: {
                objectApiName: related1Lv,
                actionName: actionName
            },
            state: {}
        };
        if (actionName === 'new') {
            console.log(this.Lv1ReferencedField + '=' + defaultOrgId);
            navParams.state.recordTypeId = this.selectedRecordTypeId;
            navParams.state.defaultFieldValues = encodeDefaultFieldValues({
                [this.Lv1ReferencedField]: defaultOrgId
                // , NumberOfEmployees: 72
                // 필드 기본 값 설정 필요 시 추가 {필드 이름 : 값}
            });
        } else if (recordId) {
            navParams.attributes.recordId = recordId;
        }

        // console.log("navParams.state : ", JSON.stringify(navParams.state))
        this[NavigationMixin.Navigate](navParams);
    }

    handleSearchValue(event) {
        this.inputSearchValue = event.target.value;
        this.filterData();
    }

    filterData() {
        const searchKey = this.inputSearchValue.toLowerCase();
        // 검색어가 비어있는지 확인
        if (!searchKey) {
            this.isExpandDataTable = false; // 검색어가 비어있으면 isExpandDataTable을 false로 설정
        }
        
        this.filteredData = this.fullMyData.map(row => {
            // Lv1ClientData에서 일치하는 항목 검색
            let matchesInLv1 = row.Lv1ClientData.some(cell =>
                cell.value && typeof cell.value === 'string' && cell.value.toLowerCase().includes(searchKey));

            // Lv2ClientData에서 일치하는 항목 검색 (단, 토글된 경우에만)
            let matchesInLv2 = [];
            if (row.showDetails && row.Lv2ClientData) {
                matchesInLv2 = row.Lv2ClientData.filter(detailRowArray =>
                    detailRowArray.some(detailCell =>
                        detailCell.value && typeof detailCell.value === 'string' && detailCell.value.toLowerCase().includes(searchKey))
                );
            }

            // Lv1 또는 Lv2에서 일치하는 항목이 있는 경우에만 해당 row를 결과에 포함
            if (matchesInLv1 || matchesInLv2.length > 0) {
                return { ...row, Lv2ClientData: matchesInLv2.length > 0 ? matchesInLv2 : row.Lv2ClientData };
            }
            return null;
        }).filter(row => row !== null);

        // 필터링된 데이터에 새로운 인덱스 부여
        this.filteredData = this.filteredData.map((row, index) => ({
            ...row,
            index: index + 1  // 1부터 시작하는 새로운 인덱스
        }));

        if (this.setMaxRow) {
            this.MyData = this.filteredData.slice(0, this.setMaxRow);
        } else {
            this.MyData = this.filteredData;
        }
        this.MyData = this.setMaxRow ? this.filteredData.slice(0, this.sexMaxRow) : this.filteredData;
        // this.nothingSearchMsg = this.MyData.length === 0 ? '표시할 항목이 없습니다.' : '';

    }

    handleCreateRecord() {
        this.handleCreateRecordModal();
        this.navigateToCrudPage(this.navigationType, this.related1Lv, 'new', null, this.selectedRecordTypeId);
    }

    getActionNameFromEvent(event) {
        const selectedValue = event.detail.value;

        if (selectedValue) {
            return selectedValue
        }

        return event.target.value || event.currentTarget.value;
    }

    getRowIdFromEvent(event, actionName) {
        console.log('이벤트 target: ', event.target)
        console.log('이벤트 currentTarget: ', event.currentTarget)
        console.log('closest data-id:', event.target.closest('[data-id]'));

        if (actionName !== 'new') {
            return event.target.closest('[data-id]')?.dataset.id;
        }

        return null;
    }

    isCheckActionLevel(actionName) {
        return actionName === 'DetailEdit' || actionName === 'DetailDelete';
    }

    //다중 or 단일 삭제 구분
    handleDeleteAction(rowId) {
        if (rowId) {
            this.deleteSelectedRecord(rowId);
        } else {
            this.deleteSelectedRecord();
        }
    }

    deleteSelectedRecord(rowId) {
        let selectedIds;
        if (rowId) {
            selectedIds = [rowId];
        } else {
            selectedIds = this.getSelectedRowIds();
        }

        if (selectedIds.length === 0) {
            this.showToast('실패', '삭제할 레코드를 선택해주세요.', 'error');
            return;
        }

        this.requestConfirmation(`선택한 ${selectedIds.length}개의 항목을 삭제하시겠습니까?`, () => {
            const recordIdListString = JSON.stringify(selectedIds);

            deleteRecord({ recordIdList: recordIdListString })
                .then(result => {
                    if (result.Result) {
                        this.showToast('성공', `${result.Count}개의 레코드가 삭제되었습니다.`, 'success');
                        this.refreshDataAfterDelete(selectedIds);

                    } else {
                        let errorMessage = result.error ? (result.error.message || JSON.stringify(result.error)) : '';
                        this.showToast('실패', errorMessage, 'Warning');
                    }
                })
                .catch(error => {
                    this.handleError(error);
                })
        });
    }

    refreshDataAfterDelete(idsToDelete) {
        this.MyData = this.MyData.filter(item => !idsToDelete.includes(item.Id));

        if (this.MyData.length < this.setMaxRow) {
            let currentMyDataIds = new Set(this.MyData.map(item => item.Id));
            let additionalRows = [];

            for (let item of this.fullMyData) {
                if (!currentMyDataIds.has(item.Id) && !idsToDelete.includes(item.Id)) {
                    additionalRows.push(item);
                    currentMyDataIds.add(item.Id);

                    if (additionalRows.length >= this.setMaxRow - this.MyData.length) {
                        break;
                    }
                }
            }

            this.MyData = [...this.MyData, ...additionalRows];
        }

        this.MyData.forEach((item, index) => {
            item.index = index + 1;
        });
        this.isChecked = false;
    }

    handleOwnerChangeModal() {
        const selectedRows = this.MyData.filter(row => row.selected);

        if (selectedRows.length > 0) {
            this.selectedRowIds = selectedRows.map(row => row.Id);
            console.log("handleOwnerChange 선택된 행 : ", this.selectedRowIds)
            this.handleOwnerModal();
        } else if (selectedRows.length === 0) {
            this.showToast('오류', '변경할 행을 선택해주세요.', 'error');
        }
    }

    handleOwnerValue(event) {
        this.searchOwnerKey = event.target.value;
        this.inputOwnerValue = this.searchOwnerKey;

        if (this.searchOwnerKey) {
            findUsers({ searchTerm: this.searchOwnerKey })
                .then(result => {
                    if (result && result.length > 0) {
                        this.users = [...result];
                        this.isSearchUserName = true;
                    } else {
                        this.users = [];
                        this.isSearchUserName = false;
                    }
                })
                .catch(error => {
                    this.handleError(error);
                    this.isSearchUserName = false;
                });
        } else {
            this.users = [];
            this.isSearchUserName = false;
        }
    }

    handleChangeOwner() {
        changeOwner({ recordIdList: JSON.stringify(this.selectedRowIds), newOwnerId: this.selectedOwnerId })
            .then(result => {
                console.log('소유자 변경 성공 : ', result);
                this.inputOwnerValue = '';
                this.isChangeOwnerModalOpen = false;
                this.showToast('성공', '정상적으로 소유자가 변경되었습니다', 'success')
                this.handleCancleAllRows();
                this.getDataAgain();
            })
            .catch(error => {
                this.showToast('에러', '소유자 변경에 실패했습니다.', 'error')
                this.handleError(error);
            });
    }

    handleUserSelect(event) {
        const selectedOwnerId = event.currentTarget.dataset.id;
        const selectedUserName = event.currentTarget.dataset.name;

        this.selectedOwnerId = selectedOwnerId;
        this.inputOwnerValue = selectedUserName;
        this.isSearchUserName = false;
    }

    handleRowSelection(event) {
        event.stopPropagation();

        if (event.target.name === "options") {
            const rowId = event.target.dataset.id;

            this.MyData = this.MyData.map(row => {
                if (row.Id === rowId) {
                    return { ...row, selected: !row.selected };
                }
                return row;
            });
        }
        const selectedRows = this.MyData.filter(row => row.selected);

        if (selectedRows.length > 0) {
            this.isChecked = true;
        } else if (selectedRows.length == 0) {
            this.isChecked = false;
        }
    }

    handleSelectAllRows(event) {
        this.selectAllChecked = !this.selectAllChecked;
        if (this.selectAllChecked) {
            this.isChecked = true;
        } else {
            this.isChecked = false;
        }
        this.MyData = this.MyData.map(row => ({ ...row, selected: this.selectAllChecked }));
    }

    handleCancleAllRows() {
        this.selectAllChecked = false;
        this.MyData = this.MyData.map(row => {
            return { ...row, selected: false };
        });
    }

    handleError(error) {
        let userMessage = '예기치 못한 문제가 발생했습니다. 관리자에게 문의하거나 다시 시도해 주세요.';
        console.error('Error:', error);
        console.error('Error:', error.message);
        this.showToast('오류', userMessage, 'error');
    }

    handleEditFailure() {
        this.MyData = [...this.originalMyData];
        this.isTableEditing = false;
        this.isExpandDataTable = false;

        this.showToast('실패', '데이터 편집에 실패했습니다. 데이터를 확인해주세요.', 'info');
    }

    handleTableAllData() {
        this.isTableVisible = !this.isTableVisible;
    }

    handleCreateRecordModal() {
        this.isCreateRecordModalOpen = !this.isCreateRecordModalOpen;
    }

    handleOwnerModal() {
        this.inputOwnerValue = '';
        this.isChangeOwnerModalOpen = !this.isChangeOwnerModalOpen;
    }

    handleRecordTypeIdChange(event) {
        this.selectedRecordTypeId = event.detail.value;
    }

    handleExpandTableData() {
        this.isExpandDataTable = !this.isExpandDataTable;

        this.MyData = this.MyData.map(row => ({
            ...row,
            showDetails: this.isExpandDataTable
        }));

        this.MyData = [...this.MyData];
    }

    downloadExcel(type) {
        // UTF-8의 BOM을 추가합니다.
        let BOM = "\uFEFF";
        let csvContent = "data:text/csv;charset=utf-8," + BOM;

        // CSV 데이터를 생성합니다.
        this.MyData.forEach((row, index) => {

            console.log('excel row : ', JSON.stringify(row, null, 2));

            // Level 1 데이터의 컬럼 헤더 추가 (첫 번째 행에만 추가)
            if (index === 0) {
                let headerStringLv1 = this.Lv1Columns.map(col => col.label).join(',');
                csvContent += headerStringLv1 + "\r\n";
            }

            // Level 1 데이터 행 추가
            let rowStringLv1 = row.Lv1ClientData.map(cell => `"${cell.value != null ? cell.value : ''}"`).join(',');
            csvContent += rowStringLv1 + "\r\n";

            // Level 2 데이터 행이 존재하는 경우에만 처리 && 상/하위 다운로드 클릭됐을 때만 처리
            if (row.Lv2ClientData && row.Lv2ClientData.length > 0 && type === 'parent_child') {
                // Level 2 데이터의 컬럼 헤더 추가 (각 Level 1 행 아래에 추가)
                let headerStringLv2 = ',' + this.Lv2Columns.map(col => col.label).join(',');
                csvContent += headerStringLv2 + "\r\n";
                console.log('csvContent lv2 헤더까지 2', JSON.stringify(csvContent, null, 2))

                // Level 2 데이터 행 추가
                row.Lv2ClientData.forEach(l2Row => {
                    let rowStringLv2 = ',' + this.Lv2Columns.map((col, index) => {
                        // l2Row는 배열이기 때문에 인덱스를 사용하여 접근
                        let value = l2Row[index].value; // fieldApiName 대신 index를 사용

                        // 여기서 undefined를 체크하여 빈 문자열로 대체합니다.
                        return `"${value !== undefined ? value : ''}"`;
                    }).join(',');
                    csvContent += rowStringLv2 + "\r\n";
                });
            }
            //Level 1과 Level 2 사이에 구분선을 추가합니다
            //csvContent += "\r\n"; // 빈 줄 추가
        });

        // CSV 데이터를 URI로 인코딩합니다.
        let encodedUri = encodeURI(csvContent);

        // 임시 링크 요소를 생성하고 다운로드를 트리거합니다.
        let link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "relatedListCustom.csv"); // 다운로드할 파일 이름
        document.body.appendChild(link); // 필수: Firefox에서의 호환성을 위해

        link.click(); // 링크 클릭
        document.body.removeChild(link); // 클릭 후 링크 제거
    }

    handleCheckboxValueChange(event) {
        const isChecked = event.target.checked;
        const checkboxKey = event.target.dataset.key;

        this.updateMyData(checkboxKey, isChecked);
    }

    handleCellValueChange(event) {
        const cellKey = event.target.dataset.key;
        const isCheckbox = event.target.type === 'checkbox';
        const updatedValue = isCheckbox ? event.target.checked : event.target.value;

        // if(this.isDebug){console.log('ischeckbox :' , isCheckbox, '체크여부: ' ,updatedValue, ' |', cellKey)}

        this.updateMyData(cellKey, updatedValue);
    }

    updateMyData(cellKey, updatedValue) {
        if (this.isDebug) { console.log("cellKey : ", cellKey, 'updatedValue : ', updatedValue) }
        this.MyData = this.MyData.map(row => {
            row.Lv1ClientData = this.processLevel1CellValueChange(row.Lv1ClientData, cellKey, updatedValue);

            if (row.Lv2ClientData) {
                row.Lv2ClientData = this.processLevel2CellValueChange(row.Lv2ClientData, cellKey, updatedValue);
            }

            return row;
        });
    }

    processLevel1CellValueChange(Lv1ClientData, cellKey, updatedValue) {
        return Lv1ClientData.map(cell => {
            if (cell.key === cellKey) {
                return this.updateCellValue(cell, updatedValue);
            }

            return cell;
        });
    }

    processLevel2CellValueChange(Lv2ClientData, cellKey, updatedValue) {
        return Lv2ClientData.map(detailRow => {
            const updatedDetailRow = detailRow.map(detailCell => {
                if (detailCell.key === cellKey) {
                    detailCell = this.updateCellValue(detailCell, updatedValue);
                }
                return detailCell;
            });

            return updatedDetailRow;
        });
    }

    updateCellValue(cell, updatedValue) {
        if (this.isDebug) { console.log(`Before 업데이트 - Cell Key: ${cell.key}, Value: ${cell.value}, New Value: ${cell.newValue}`); }
        cell.newValue = updatedValue;
        if (this.isDebug) { console.log(`After 업데이트 - Cell Key: ${cell.key}, Value: ${cell.value}, New Value: ${cell.newValue}`); }

        return cell;
    }

    toggleTableEdit() {
        this.isTableEditing = !this.isTableEditing;
        this.processTableEdit();
    }

    processTableEdit() {
        this.MyData = this.MyData.map(row => {
            row.Lv1ClientData = this.processLevel1TableEdit(row.Lv1ClientData);

            if (row.Lv2ClientData) {
                row.Lv2ClientData = this.processLevel2TableEdit(row.Lv2ClientData);
            } else {
                row.Lv2ClientData = [];
            }
            return { ...row, isTableEditing: this.isTableEditing };
        });

        // 편집모드 취소 용 : originalValue | 편집 저장 용 : newValue
        this.MyData = [...this.MyData];
        this.logSetting('편집 모드 데이터 processTableEdit : ', this.MyData)
    }

    processLevel1TableEdit(Lv1ClientData) {
        return Lv1ClientData.map(cell => {
            cell.isEditable = !this.readonlyFieldsLv1.includes(cell.fieldApiName);
            if (this.isTableEditing) {
                cell.originalValue = cell.value;
                // cell.newValue = cell.value !== undefined ? cell.value : ''; 

                // 콤마 제거
                if (cell.inputType === "number" && cell.value !== undefined) {
                    cell.newValue = this.removeCurrencySymbolsFromNumber(cell.value);
                } else {
                    cell.newValue = cell.value !== undefined ? cell.value : '';
                }

            } else {
                cell.value = cell.originalValue;
                delete cell.originalValue;
            }
            return cell;
        });
    }

    processLevel2TableEdit(Lv2ClientData) {
        return Lv2ClientData.map((detailRow, index) => {
            return detailRow.map(detailCell => {
                detailCell.isEditable = !this.readonlyFieldsLv2.includes(detailCell.fieldApiName);
                if (this.isTableEditing) {
                    detailCell.originalValue = detailCell.value;
                    if (detailCell.inputType === "number" && detailCell.value !== undefined) {
                        detailCell.newValue = this.removeCurrencySymbolsFromNumber(detailCell.value);
                    } else {
                        detailCell.newValue = detailCell.value !== undefined ? detailCell.value : '';
                    }
                } else {
                    detailCell.value = detailCell.originalValue !== undefined ? detailCell.originalValue : detailCell.value;
                    delete detailCell.originalValue;
                }
                return detailCell;
            });
        }).map((detailRow, index) => {
            detailRow.index = index + 1;
            return detailRow;
        });
    }

    handlePicklistChange(event) {
        const key = event.target.dataset.key;
        const newValue = event.detail.value;

        this.MyData = this.MyData.map(row => {
            row.Lv1ClientData = row.Lv1ClientData.map(cell => {
                if (cell.key === key) {
                    cell.newValue = newValue;
                }
                return cell;
            });

            row.Lv2ClientData = row.Lv2ClientData.map(detailRows =>
                detailRows.map(cell => {
                    if (cell.key === key) {
                        cell.newValue = newValue;
                    }
                    return cell;
                })
            );
            return row;
        });
    }

    saveTableEdits() {
        let updatedRowsLevel1 = this.processLevel1TableSaves(this.MyData);
        let updatedRowsLevel2 = this.processLevel2TableSaves(this.MyData);

        if (updatedRowsLevel1.length > 0 || updatedRowsLevel2.length > 0) {
            let jsonDataLevel1 = JSON.stringify(updatedRowsLevel1);
            let jsonDataLevel2 = JSON.stringify(updatedRowsLevel2);
            this.logSetting('saveTableEdits jsonDataLevel1 : ', updatedRowsLevel1)
            this.logSetting('saveTableEdits jsonDataLevel2 : ', updatedRowsLevel2)

            this.sendDataToServer(jsonDataLevel1, jsonDataLevel2);
        }
    }

    processLevel1TableSaves(data) {
        let updatedRows = [];

        data.forEach(row => {
            let updatedValues = this.processRowSaveData(row.Lv1ClientData, this.typeMaps.Lv1TypeMap);

            if (Object.keys(updatedValues).length > 0) {
                updatedRows.push({ id: row.Id, values: updatedValues });
            }
        });

        return updatedRows;
    }

    processLevel2TableSaves(data) {
        let updatedRows = [];

        data.forEach(row => {
            if (row.Lv2ClientData) {
                row.Lv2ClientData.forEach(detailRow => {
                    let updatedValues = this.processRowSaveData(detailRow, this.typeMaps.Lv2TypeMap);

                    if (Object.keys(updatedValues).length > 0) {
                        updatedRows.push({ id: detailRow[0].id, values: updatedValues });
                    }
                });
            }
        });

        return updatedRows;
    }

    processRowSaveData(rowData) {
        let updatedValues = {};

        rowData.forEach(cell => {
            this.logSetting(' processRowSaveData 데이터 ', cell)
            if (cell.newValue !== undefined && cell.newValue !== null) {

                if (cell.inputType === 'currency' || cell.inputType === 'number') {
                    cell.newValue = this.removeCurrencySymbolsFromNumber(cell.newValue);
                }

                if (cell.inputType === 'datetime-local') {
                    const dateObj = new Date(cell.newValue);
                    cell.newValue = dateObj.toISOString();
                    console.log('datetime cell.newValue ', cell.newValue)
                }

                if (cell.objName == 'Contact') {
                    if (cell.fieldApiName == 'Name') {
                        cell.fieldApiName = 'LastName';

                        this.logSetting(' processRowSaveData contact 데이터 ', cell.fieldApiName)

                    }
                }

                updatedValues[cell.fieldApiName] = cell.newValue;
            }
        });

        return updatedValues;
    }

    sendDataToServer(jsonDataLevel1, jsonDataLevel2) {
        console.log("Starting sendDataToServer");
        // Lv1 오브젝트가 history로 끝나지 않으면 업데이트 진행
        if (!/history$/i.test(this.related1Lv)) {
            updateData({ jsonData: jsonDataLevel1, objectName: this.related1Lv })
                .then(result => {
                    console.log("Level 1 update completed, result:", result);
                    if (result === 'Success') {
                        this.isTableEditing = false;
                        console.log('1 레벨 업데이트 성공');
                        this.updateMyDataLevel1(jsonDataLevel1);
    
                        // Lv2 오브젝트가 history로 끝나지 않으면 업데이트 진행
                        if (jsonDataLevel2.length > 2 && !/history$/i.test(this.Z)) {
                            console.log("Lv2 업데이트 진입 >>>>>>>> ");
                            console.log("Level 2 data to be sent:", JSON.stringify(jsonDataLevel2));
                            return updateData({ jsonData: jsonDataLevel2, objectName: this.related2Lv });
                        } else {
                            this.showToast('성공', '데이터 편집에 성공했습니다.', 'success');
                            console.log("Lv2 없음 또는 Lv2 오브젝트가 history로 끝남");
                            return 'Lv1 성공';
                        }
                    } else {
                        console.log("Level 1 편집 실패");
                        throw new Error("Level 1 편집 실패");
                    }
                })
                .then(result => {
                    console.log("Level2 result >>>>>>>>>>>>>>", result);
                    if (result === 'Success') {
                        this.updateMyDataLevel2(jsonDataLevel2);
                        this.showToast('성공', '모든 데이터 편집에 성공했습니다.', 'success');
                    } else if (result === 'Lv1 성공') {
                        console.log("Level 1만 편집 성공, Level 2 데이터 편집 없음 또는 Lv2 오브젝트가 history로 끝남");
                    } else {
                        throw new Error("Level 2 편집 실패");
                    }
                })
                .catch(error => {
                    console.error("Error caught in catch block:", error);
                    if (error instanceof Error) {
                        console.error("Error message:", error.message);
                        console.error("Error stack:", error.stack);
                    } else {
                        console.error("Unexpected error:", error);
                    }
                    this.handleEditFailure();
                    this.showToast('실패', `데이터 편집에 실패했습니다: ${error.message}`, 'error');
                })
                .finally(() => {
                    console.log("Finally block executed");
                    this.handleAfterEdit();
                });
        } else {
            // Lv1 오브젝트가 history로 끝나면 업데이트 제외하고 메시지 표시
            console.log("Lv1 오브젝트가 history로 끝남, 업데이트 제외");
            this.showToast('성공', '데이터 편집에 성공했습니다.', 'success');
            this.handleAfterEdit();
        }
    }

    handleAfterEdit() {
        this.isTableEditing = false;
        this.inputSearchValue = '';
        if (this.isExpandDataTable) {
            this.handleExpandTableData();
        }

    }

    updateCellValues(cell, updatedValues) {
        let updatedValue = updatedValues[cell.fieldApiName] ?? cell.value;

        updatedValue = this.formatValues(updatedValue, cell.inputType);

        if (cell.isCheckbox) {
            return { ...cell, value: updatedValue, checked: updatedValue, newValue: null };
        } else {
            return { ...cell, value: updatedValue, newValue: null };
        }
    }

    updateMyDataLevel1(updatedRowsJson) {
        let updatedRows = JSON.parse(updatedRowsJson);

        this.MyData = this.MyData.map(row => {
            let updateFound = updatedRows.find(uRow => uRow.id === row.Id);

            if (updateFound) {
                return {
                    ...row,
                    Lv1ClientData: row.Lv1ClientData.map(cell => this.updateCellValues(cell, updateFound.values))
                };
            }
            return row;
        });

        this.originalMyData = JSON.parse(JSON.stringify(this.MyData));
    }

    updateMyDataLevel2(updatedRowsJson) {
        let updatedRows = JSON.parse(updatedRowsJson);

        this.MyData = this.MyData.map(row => {
            if (row.Lv2ClientData) {
                row.Lv2ClientData = row.Lv2ClientData.map((detailRow, index) => {
                    let updatedRow = updatedRows.find(updatedRow => updatedRow.id === detailRow[0].id);

                    if (updatedRow) {
                        detailRow = detailRow.map(cell => {
                            if (updatedRow.values.hasOwnProperty(cell.fieldApiName)) {
                                cell.value = updatedRow.values[cell.fieldApiName];
                            }
                            return cell;
                        });
                    }

                    detailRow.index = index + 1;
                    return detailRow;
                });
            }

            return row;
        });

        this.originalMyData = JSON.parse(JSON.stringify(this.MyData));
    }

    calculateLv2CountAll(level2Rows, Lv2RelatedObjApiName) {
        let totalCount = 0;

        level2Rows.forEach(l2Row => {
            const relatedData = l2Row[Lv2RelatedObjApiName];
            if (Array.isArray(relatedData)) {
                totalCount += relatedData.length;
            }
        });
        return totalCount;
    }

    calculate2LvCount(Lv2ClientData) {
        return Lv2ClientData.length;
    }

    requestConfirmation(message, callback) {
        if (confirm(message)) {
            callback();
        }
    }

    setDefaultOrValue(setValue, defaultValue) {
        return setValue || defaultValue
    }

    closeExcelModal() {
        this.isExcelModalOpen = false;
        this.excelDownType = '';
    }

    showToast(title, message, variant) {
        this.dispatchEvent(new ShowToastEvent({
            title: title,
            message: message,
            variant: variant,
            mode: 'dismissable' // 사용자가 닫기 가능
        }));
    }

    getCellInputType(fieldApiName, typeMap) {
        const sfType = typeMap[fieldApiName];

        //수정 금지 할 필드 여기 추가
        const readOnlyFieldTypes = ['CreatedBy.Name', 'CreatedBy'];

        // inputTypeMapping 수정 시 컨트롤러 updateData 체크
        const inputTypeMapping = {
            'DATE': 'date',
            'DATETIME': 'datetime-local',
            'CHECKBOX': 'checkbox',
            'DOUBLE': 'number',
            'NUMBER': 'number',
            'PERCENT': 'number',
            'CURRENCY': 'currency',
            'URL': 'url',
            'PHONE': 'tel',
            'EMAIL': 'email',
            'BOOLEAN': 'checkbox',
            'ENCRYPTEDSTRING': 'encryptedString'
        }
        this.typePicklistOptions = this.convertObjToOptions(fieldApiName, typeMap);

        const isReadOnly = readOnlyFieldTypes.includes(fieldApiName) ||
            this.isReadOnlyCheck(fieldApiName, this.readonlyFieldsLv1) ||
            this.isReadOnlyCheck(fieldApiName, this.readonlyFieldsLv2);

        if (this.isDebug) { console.log(`${fieldApiName}, before Type: ${sfType}, ReadOnly : ${isReadOnly}`); }
        let inputType = inputTypeMapping[sfType] || 'text';
        if (this.isDebug) { console.log(`${fieldApiName}, after Type: ${inputType}, ReadOnly : ${isReadOnly}`); }

        const isDatetimeLocal = inputType === 'datetime-local';
        const isDate = inputType === 'date';
        const isCreateddate = fieldApiName === 'CreatedDate';
        const isLastmodifieddate = fieldApiName === 'LastModifiedDate';

        return {
            type: inputType,
            isReadOnly: isReadOnly,
            options: this.typePicklistOptions,
            isDate: isDate,
            isDatetimeLocal: isDatetimeLocal,
            isCreateddate: isCreateddate,
            isLastmodifieddate: isLastmodifieddate

        };
    }

    convertObjToOptions(fieldApiName, typeMap) {
        let options = [];
        if (Array.isArray(typeMap[fieldApiName])) {
            options = typeMap[fieldApiName].map(value => ({ value, label: value }));
            this.logSetting('옵션 : ', options)
        } else if (typeof typeMap[fieldApiName] === 'object') {
            options = Object.entries(typeMap[fieldApiName]).map(([key, value]) => ({ value: key, label: value }));
            this.logSetting('옵션 : ', options)
        }

        return options;
    }

    isReadOnlyCheck(fieldApiName, readOnlyFields) {
        if (!readOnlyFields) {
            return false;
        }
        if (fieldApiName.toLowerCase() === 'name') {
            return false;
        }
        const fieldNameLower = fieldApiName.toLowerCase();
        return readOnlyFields.some(readOnlyFields => readOnlyFields.toLowerCase() === fieldNameLower);
    }

    compactValue(row, fieldName, cellType) {
        // fieldName이 'CreatedBy'일 경우 'CreatedBy.Name'으로 변경
        if (fieldName === 'CreatedBy') {
            fieldName = 'CreatedBy.Name';
        }
        let originalValue;

        // fieldName이 점으로 구분된 경우, 객체 탐색
        if (fieldName.includes('.')) {
            const path = fieldName.split('.');
            let currentObject = row;
            for (const part of path) {
                if (currentObject && typeof currentObject === 'object') {
                    currentObject = currentObject[part];
                } else {
                    currentObject = null;
                    break;
                }
            }
            originalValue = currentObject;
        } else {
            originalValue = row[fieldName];
        }

        let value = this.formatValues(originalValue, cellType.type);
        let isChecked = cellType.type === 'checkbox' ? true : false;

        return {
            value: typeof value === 'string' ? value.replace(/<\/?[^>]+(>|$)/g, "") : value,
            isChecked: isChecked
        };
    }

    formatValues(value, cell) {
        switch (cell) {
            case 'currency':
                return this.formatCurrencyValue(value);
            case 'datetime-local':
                return this.formatDateTimeLocal(value);
            // case 'date':
            //     return this.formatDateTimeLocal(value, cell);
            case 'checkbox':
                return this.formatCheckboxValue(value);
            case 'number':
                return this.formatNumberWithCommas(value);
            case 'encryptedString':
                if (!this.checkEncryptedDataView) {
                    value = value.replace(/./g, '*');
                }
                return value;
            default:
                return value;
        }
    }

    formatCheckboxValue(value) {
        return value === 'true' || value === true;
    }

    formatCurrencyValue(value) {
        if (!value) {
            value = 0;
        }
        value = this.formatCurrencyWithCommasAndSymbol(value);

        return value;
    }

    formatNumberWithCommas(value) {
        if (!value) { value = '' }
        return new Intl.NumberFormat('ko-KR').format(value);

    }

    formatCurrencyWithCommasAndSymbol(value) {
        return new Intl.NumberFormat('ko-KR', { style: 'currency', currency: this.currencyIsoCode }).format(value);

    }

    formatDateTimeLocal(value) {
        if (!value) return '';

        return value.split('.')[0].slice(0, -3);
    }

    removeCurrencySymbolsFromNumber(value) {
        // 달러($), 엔화(¥), 유로(€), 원화(₩) 기호 및 콤마(,) 제거
        // value = value.replace(/[$¥€₩,]/g, '');

        // 숫자가 아닌 모든 문자 제거
        value = value.replace(/[^\d.-]/g, '');

        return value;
    }


    // 숫자 합계 세팅
    setSumData(sumObj) { // ex. {Sum1: {NumberTest__c: {label: '', value: 1590}}, Sum2: OpNumberTest__c: {label: '', value: 5959}}}
        const keys = Object.keys(sumObj);
        const keysLen = Object.keys(sumObj).length;

        // 숫자 합계 필드가 2개일 때
        if (keysLen == 2) {
            this.isSum = true;
            this.isSumFirst = true;
            this.isSumSecond = true;

            if (this.sumFirstObj.fieldName == sumObj.Sum1.Name) {
                this.sumResultFirst.label = sumObj.Sum1.Label;
                this.sumResultFirst.value = sumObj.Sum1.Type == 'CURRENCY' ? this.currencyType + this.formatNumberWithCommas(sumObj.Sum1.Value) : this.formatNumberWithCommas(sumObj.Sum1.Value);
                this.sumResultSecond.label = sumObj.Sum2.Label;
                this.sumResultSecond.value = sumObj.Sum2.Type == 'CURRENCY' ? this.currencyType + this.formatNumberWithCommas(sumObj.Sum2.Value) : this.formatNumberWithCommas(sumObj.Sum2.Value);
            } else {
                this.sumResultFirst.label = sumObj.Sum2.Label;
                this.sumResultFirst.value = sumObj.Sum2.Type == 'CURRENCY' ? this.currencyType + this.formatNumberWithCommas(sumObj.Sum2.Value) : this.formatNumberWithCommas(sumObj.Sum2.Value);
                this.sumResultSecond.label = sumObj.Sum1.Label;
                this.sumResultSecond.value = sumObj.Sum1.Type == 'CURRENCY' ? this.currencyType + this.formatNumberWithCommas(sumObj.Sum1.Value) : this.formatNumberWithCommas(sumObj.Sum1.Value);
            }

            // 숫자 합계 필드가 1개일 때
        } else if (keysLen == 1) {
            this.isSum = true;
            this.isSumFirst = true;
            this.isSumSecond = false;
            this.sumResultFirst.label = sumObj.Sum1.Label;
            this.sumResultFirst.value = sumObj.Sum1.Type == 'CURRENCY' ? this.currencyType + this.formatNumberWithCommas(sumObj.Sum1.Value) : this.formatNumberWithCommas(sumObj.Sum1.Value);
            this.sumResultSecond = {};
        }
    }

    createLevel2DataMap(Lv2DataRows, Lv2RelatedObjApiName) {
        const Lv2map = new Map();
        Lv2DataRows.forEach(row => {
            Lv2map.set(row.Id, row[Lv2RelatedObjApiName] || []);
        });

        return Lv2map;
    }

    settingErrorMsg(data) {
        console.log('에러 셋팅')

        this.FirstRenderErrMsg = data['1Lv'] && data['1Lv'].Message ? data['1Lv'].Message
            : data['2Lv'] && data['2Lv'].Message ? data['2Lv'].Message
                : '';

        this.isNotChildObj = this.FirstRenderErrMsg !== '';

        console.log('this.FirstRenderErrMsg', this.FirstRenderErrMsg);
    }

    getDataAgain() {
        console.log("a,b,c : ", this.recordId, this.related1Lv, this.related2Lv);

        getData({ recordId: this.recordId, parentObjName: this.related1Lv, componentObjName: this.related2Lv })
            .then(result => {
                console.log(':::::::::::::::: getData again ::::::::::::::::');
                this.processData(result.Result);
            })
            .catch(error => {
                console.log("getData again 에러");
                this.handleError(error);
            });
    }

    getUrl(objectApiName, recordId, related1Lv) {
        let baseUrl = window.location.href;
        let domainEndings = ['.sandbox', '.develop', '.lightning'];
        let domain = '';

        // 도메인 종류에 따라 기본 URL 설정
        for (let ending of domainEndings) {
            if (baseUrl.indexOf(ending) !== -1) {
                domain = baseUrl.slice(0, baseUrl.indexOf(ending) + ending.length);
                break;
            }
        }

        if (!domain) {
            domain = baseUrl.slice(0, baseUrl.indexOf('.lightning') + '.lightning'.length);
        }

        // 관련 URL 부분 추가
        let path = related1Lv ? `/related/${related1Lv}/view` : '/view';
        return `${domain}.lightning.force.com/lightning/r/${objectApiName}/${recordId}${path}`;
    }

    getSelectedRowIds() {
        return this.MyData.filter(row => row.selected).map(row => row.Id);
    }

    get tableToggleIcon() {
        return this.isTableVisible ? 'utility:chevronup' : 'utility:chevrondown';
    }
    get isList() {
        return this.viewType === 'List';
    }
    get isTile() {
        return this.viewType === 'Tile';
    }
    get Lv1Count() {
        if(this.isBlankTh) {
            return (this.activationNo && this.activationCheckedFields) ? this.Lv1Columns.length + 3
                : (this.activationNo || this.activationCheckedFields) ? this.Lv1Columns.length + 2
                    : this.Lv1Columns.length + 1;
        }
        return (this.activationNo && this.activationCheckedFields) ? this.Lv1Columns.length + 2
            : (this.activationNo || this.activationCheckedFields) ? this.Lv1Columns.length + 1
                : this.Lv1Columns.length;
    }
    get errorMessageColspan() {
        return (this.activationNo && this.activationCheckedFields) ? this.Lv1Columns.length + 3
            : (this.activationNo || this.activationCheckedFields) ? this.Lv1Columns.length + 2
                : this.Lv1Columns.length + 1;
    }
    get buttonIcon() {
        return this.isExpandDataTable ? 'utility:contract' : 'utility:expand';
    }
    get getRelated2Lv() {
        return this.related2Lv ? this.related2Lv : null;
    }
    
    get shouldFetchObjectInfo() {
        return this.related1Lv && !this.related1Lv.endsWith('History');
    }

    handleFilterbtn() {
        this.isFilter = !this.isFilter;
    }

    logSetting(title, data) {
        if (this.isDebug) {
            console.groupCollapsed(`>>>>>>>>>>>>>>>>>>>>>>>>> ${title} : `);
            console.log(JSON.stringify(data, null, 2));
            console.groupEnd();
        }
    }

    movePageOnlyDataArea(event) {
        let url = '';
        if (event.target.dataset.url) {
            url = event.target.dataset.url;
            console.log(event.target.dataset.url);
        }

        this[NavigationMixin.Navigate]({
            type: 'standard__webPage',
            attributes: {
                url: url // Replace with your page URL
            }
        });
    }

    handleExcelType(event) {
        // this.excelDownType = event.target.dataset;
        this.excelDownType = event.currentTarget.dataset.value;

        console.log('엑셀타입은? >>>>> ', this.excelDownType);


    }

}