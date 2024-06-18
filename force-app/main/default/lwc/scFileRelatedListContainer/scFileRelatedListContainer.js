// scFileRelatedListContainer.js
import { LightningElement, api } from 'lwc';
import ScFileRelatedListHeader from 'c/scFileRelatedListHeader';
import ScFileRelatedListBody from 'c/scFileRelatedListBody';
import ScFileRelatedListFooter from 'c/scFileRelatedListFooter';

import getFileData from '@salesforce/apex/SC_FileRelatedListController.getFileData';

export default class ScFileRelatedListContainer extends LightningElement {
    // 기능 활성화/비활성화
    @api actUploadBtn;
    @api actDownloadBtn;
    @api actDeleteBtn;
    @api actNo;
    @api actSectionOpen;
    // 파일 정보
    @api category;
    @api title;
    @api icon;
    // 기타
    @api recordId;
    @api themeColor;
    @api countRecord;
    @api isActiveNo;
    @api isActiveDel;
    @api slideDelayTime;
    // 뷰 타입
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail;
    @api viewType_card;
    @api viewType_slide;
    // 이미지 카드 관련
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;

    @api fileData = []; originalFileData = [];
    selectedRowIds = [];
    imgSrc;
    sortOptions = {};
    customClass = '';
    activeTabValue;
    objectApiName;

    connectedCallback() {
        this.initSetting();
        this.fetchFileData();
    }

    initSetting() {
        this.customClass += 'themeColor_' + this.themeColor;
        this.slideDelayTime = this.slideDelayTime * 1000;
    }

    fetchFileData() {
        const params = {
            recordId: this.recordId,
            category: this.category,
            uploadedTime: this.uploadedTime
        };

        return this.fetchFileDataFromServer(params)
            .then((processedData) => {
                this.fileCount = processedData.length;
                this.fileData = processedData;
                this.originalFileData = processedData;

                console.log('this.fileData: ', JSON.stringify(this.fileData, null, 2));
                return processedData;
            })
            .catch((error) => {
                console.log('getFileData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error.message);
                throw error;
            });
    }

    fetchAfterUploadData() {
        const params = {
            recordId: this.recordId,
            category: this.category,
            uploadedTime: this.uploadedTime
        };

        return this.fetchFileDataFromServer(params);
    }

    fetchFileDataFromServer(params) {
        return getFileData(params)
            .then((result) => {
                console.log('getFileData result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', result);
                const processedFileData = result.Result
                    .slice(0, this.countRecord)
                    .map((fileData, index) => {
                        return this.processFileData(fileData, index);
                    });

                this.objectApiName = result.ObjectApiName;
                
                return processedFileData;
            })
            .catch((error) => {
                console.log('getFileData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error.message);
                throw error;
            });
    }

    processFileData(fileData, index) {
        let fileDataArr = {
            Id: fileData.Id,
            ContentDocumentId: fileData.ContentDocumentId,
            Title: fileData.Title,
            category: fileData.Category__c,
            SharingOption: fileData.SharingOption,  //레코드 공유 옵션 (A: 누구나 액세스 가능, R: 역할 기반 액세스, U: 사용자 액세스 제어 목록 기반 액세스, N: 공유되지 않음)
            SharingPrivacy: fileData.SharingPrivacy,    //레코드의 공유 범위 (N: 네트워크 전용, P: 포탈 공유, O: 조직 전체 공유)
            PathOnClient: fileData.PathOnClient, //파일 이름
            ContentBodyId: fileData.ContentBodyId,
            FileType: fileData.FileType,
            PublishStatus: fileData.PublishStatus,  //컨텐츠의 게시 상태 (P: 게시됨, R: 작업용, A: 아카이브됨)
            ContentSize: fileData.ContentSize < 1024 * 1024 ?
                        (fileData.ContentSize / 1024).toFixed(2) + " KB" :
                        (fileData.ContentSize / (1024 * 1024)).toFixed(2) + " MB",
            FileExtension: "." + fileData.FileExtension,
            VersionDataUrl: fileData.VersionDataUrl,
            CreatedDate: fileData.CreatedDate,
            index: index + 1
        };
        fileDataArr.ImgSrc = this.getImgSrc(fileData);
        
        return fileDataArr;
    }

    getImgSrc(fileData) {
        const origin = window.location.origin;

        return origin +
            '/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_' +
            fileData.FileExtension +
            '&versionId=' + fileData.Id +
            '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId +
            '&page=0';
    }


    handleCheckboxChange(event) {
        const { selectedId, isChecked } = event.detail;

        if (isChecked) {
            console.log('선택된 레코드 ID:', JSON.stringify(selectedId, null, 2));
            this.selectedRowIds = [...this.selectedRowIds, selectedId];
        } else {
            console.log('선택 해제된 레코드 ID:', JSON.stringify(selectedId, null, 2));
            this.selectedRowIds = this.selectedRowIds.filter(id => id !== selectedId);
        }

    }

    handleCheckboxChangeAll(event) {
        const { selectedIds, isChecked } = event.detail;

        if (isChecked) {
            console.log('선택된 레코드 ID:', JSON.stringify(selectedIds, null, 2));
            this.selectedRowIds = selectedIds;

        } else {
            console.log('선택 해제된 레코드 ID:', JSON.stringify(selectedIds, null, 2));
            this.selectedRowIds = [];
        }
    }

    handleAfterDeleteFile(event) {
        this.fileData = event.detail.map((item, index) => {
            return {
                ...item,
                index: index + 1
            };
        });
        console.log('삭제 후 부모 컴포넌트 받는 메소드: ', JSON.stringify(this.fileData, null, 2))
    }

    handleAfterUploadFile() {
        console.log('업로드 끝');
        console.log('handleAfterUploadFile: ', JSON.stringify(this.fileData, null, 2));
        this.uploadedTime = Date.now();
        console.log('시간: ', this.uploadedTime);
        console.log('category: ', this.category);

        try {
            this.fetchAfterUploadData()
                .then((newData) => {
                    const startIndex = this.fileData.length;
                    const updatedNewData = newData.map((fileData, index) => ({
                        ...fileData,
                        index: startIndex + index + 1,
                    }));

                    this.fileData = this.fileData.concat(updatedNewData);

                    this.fileCount = this.fileData.length;
                    console.log('Updated fileData: ', JSON.stringify(this.fileData, null, 2));
                })
                .catch((error) => {
                    console.error('Error in fetchAfterUploadData: ', error.message);
                });
        } catch (error) {
            console.error('Error in handleAfterUploadFile: ', error.message);
        }
    }

    handleClearRowIds() {
        console.log('handleClearRowIds aaaaaaaa: ', JSON.stringify(this.selectedRowIds, null, 2));
        this.selectedRowIds = [];
        console.log('handleClearRowIds bbbbbbbb: ', JSON.stringify(this.selectedRowIds, null, 2));
    }

    handleSearchFile(event){
        console.log(' fileter before 데 이 터 ;' , JSON.stringify(this.fileData, null, 2));
        console.log('event ================> ', event.detail);
        const searchKey = event.detail;
        const searchKeyLowerCase = searchKey.toLowerCase();
        let filteredData = [...this.fileData];

        if (searchKeyLowerCase === '') {
            // 검색어가 비어있는 경우 원본 데이터로 돌아감
            filteredData = [...this.originalFileData];
        } else {
            // 검색어가 있는 경우 원본 데이터에서 필터링 수행
            filteredData = this.originalFileData.filter((fileData) => {
                return fileData.Title.toLowerCase().includes(searchKeyLowerCase);
            });
        }

        this.fileData = filteredData;

        console.log(' filter after 데 이 터 ;' , JSON.stringify(this.fileData, null, 2));
    }

    // 정렬 기준 처리
    handleSortedBy(event) {
        this.fileData = event.detail.sortedData;
        this.sortOptions = {
            sortBy: event.detail.sortBy,
            sortDirection: event.detail.sortDirection,
            isSortBtnClick: event.detail.isSortBtnClick
        }
    }

    handleExpandToggle(event) {
        console.log('부모 토글오픈 섹션', this.actSectionOpen)
        this.actSectionOpen = event.detail.actSectionOpen;
    }

    handleComponentSizeSet(event) {
        this.isComponentSizeSmall = event.detail.isComponentSizeSmall;
        console.log('handleSetCompSize event, ', JSON.stringify(event.detail));
    }

    handleTabActive(event) {
        this.activeTabValue = event.detail;
        console.log('Parent component received activeTabValue: ', this.activeTabValue);
    }

}