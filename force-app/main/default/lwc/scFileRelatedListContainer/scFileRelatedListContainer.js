// scFileRelatedListContainer.js
import { LightningElement, api } from 'lwc';
import getFileData from '@salesforce/apex/SC_FileRelatedListController.getFileData';

/**
 * @file ScFileRelatedListContainer.js
 * @description 파일 다운로드 부모 컴포넌트 (최상위)
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
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

    //자식 컴포넌트
    scFileRelatedListHeader
    scFileRelatedListBody
    scFileRelatedListTable
    scFileRelatedListThumbnail
    scFileRelatedListCard

    fileData = []; originalFileData = [];
    selectedRowIds = [];
    imgSrc;
    sortOptions = {};
    customClass = '';
    activeTabValue;
    objectApiName;
    latestCreatedDate = null;

    connectedCallback() {
        this.initSetting();
        this.getInitFileData()
    }

    renderedCallback() {
        this.setChildComponent();
    }

    initSetting() {
        this.customClass += 'themeColor_' + this.themeColor;
        this.slideDelayTime = this.slideDelayTime * 1000;
    }

    setChildComponent() {
        this.scFileRelatedListHeader = this.template.querySelector('c-sc-file-related-list-header');
        this.scFileRelatedListBody = this.template.querySelector('c-sc-file-related-list-body');
        this.scFileRelatedListTable = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListTable;
        this.scFileRelatedListThumbnail = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListThumbnail;
        this.scFileRelatedListCard = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListCard;

        if (this.defaultViewType === '이미지 카드') {
            this.scFileRelatedListCard.calculateImageSize(this.fileData);
        }
    }

    async getInitFileData() {
        try {
            const params = {
                recordId: this.recordId,
                category: this.category,
            };

            const processedData = await this.getFileDataFromServer(params);
            this.updateFileData(processedData);

            return processedData;
        } catch (error) {
            console.error('getFileData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error.message);
            this.clearFileData();
        }
    }

    async getFileDataFromServer(params) {
        try {
            const result = await getFileData(params); //from apex
            const processedFileData = result.Result
                .slice(0, this.countRecord)
                .map((fileData, index) => this.processFileData(fileData, index));

            this.objectApiName = result.ObjectApiName;

            return processedFileData;
        } catch (error) {
            throw error;
        }
    }

    async handleAfterUploadFile() {
        try {
            const newData = await this.getAfterUploadData();
            const startIndex = this.fileData.length;
            const updatedNewData = newData.map((fileData, index) => ({
                ...fileData,
                index: startIndex + index + 1,
            }));

            this.fileData = this.fileData.concat(updatedNewData);

            this.fileCount = this.fileData.length;
            this.updateLatestCreatedDate(this.fileData);

            //카트 컴포넌트 이미지 크기 계산
            this.scFileRelatedListCard.calculateImageSize(this.fileData);

        } catch (error) {
            console.error('Error in handleAfterUploadFile: ', error.message);
        }
    }

    async getAfterUploadData() {
        try {
            const params = {
                recordId: this.recordId,
                category: this.category,
                latestCreatedDate: this.latestCreatedDate
            };

            console.log('after upload  params', JSON.stringify(params));

            return this.getFileDataFromServer(params);

        } catch (error) {
            console.error('getAfterUploadData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error.message);
            this.clearFileData();
        }
    }

    processFileData(fileData, index) {
        let fileDataArr = {
            Id: fileData.Id,
            ContentDocumentId: fileData.ContentDocumentId,
            Title: fileData.Title,
            category: fileData.Category__c,
            SharingOption: fileData.SharingOption,      //레코드 공유 옵션 (A: 누구나 액세스 가능, R: 역할 기반 액세스, U: 사용자 액세스 제어 목록 기반 액세스, N: 공유되지 않음)
            SharingPrivacy: fileData.SharingPrivacy,    //레코드의 공유 범위 (N: 네트워크 전용, P: 포탈 공유, O: 조직 전체 공유)
            PathOnClient: fileData.PathOnClient,        //파일 이름
            ContentBodyId: fileData.ContentBodyId,
            FileType: fileData.FileType,
            PublishStatus: fileData.PublishStatus,      //컨텐츠의 게시 상태 (P: 게시됨, R: 작업용, A: 아카이브됨)
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

    updateFileData(processedData) {
        this.fileCount = processedData.length;
        this.fileData = processedData;
        this.originalFileData = processedData;

        this.updateLatestCreatedDate(this.fileData);
    }

    updateLatestCreatedDate(data) {
        for (const fileData of data) {
            if (!this.latestCreatedDate || fileData.CreatedDate > this.latestCreatedDate) {
                this.latestCreatedDate = fileData.CreatedDate;
            }
        }
    }

    clearFileData() {
        this.fileData = [];
        this.originalFileData = [];
    }

    handleAfterDeleteFile(event) {
        this.fileData = event.detail.map((item, index) => {
            return {
                ...item,
                index: index + 1
            };
        });
        
        this.scFileRelatedListBody.resetCheckboxInComp();
    }

    handleCheckboxChange(event) {
        const { selectedId, isChecked } = event.detail;

        if (isChecked) {
            this.selectedRowIds = [...this.selectedRowIds, selectedId];
        } else {
            this.selectedRowIds = this.selectedRowIds.filter(id => id !== selectedId);
        }

        console.log('handleCheckboxChange ID:', JSON.stringify(selectedId, null, 2));
    }

    handleCheckboxChangeAll(event) {
        const { selectedIds, isChecked } = event.detail;
        this.selectedRowIds = isChecked ? selectedIds : [];

        console.log('handleCheckboxChangeAll ID:', JSON.stringify(selectedIds, null, 2));
    }

    handleClearRowIds() {
        // console.log('before handleClearRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
        this.selectedRowIds = [];
        // console.log('after handleClearRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
    }

    handleSearchFile(event) {
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
    }

    // 정렬 기준 처리
    handleSortedBy(event) {
        this.fileData = event.detail.sortedData;
        this.sortOptions = {
            sortBy: event.detail.sortBy,
            sortDirection: event.detail.sortDirection,
            isSortBtnClick: event.detail.isSortBtnClick
        };

        try {
            if (this.scFileRelatedListCard) {
                // 이미지 크기 계산
                this.scFileRelatedListCard.calculateImageSize(this.fileData);
            }
        } catch (error) {
            console.error('calculateImageSize 호출 중 오류 발생:', error.message);
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