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
    @api tableComponentHeight;
    @api thumbnailComponentHeight;
    @api buttonType;
    // 뷰 타입
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail;
    @api viewType_card;
    @api viewType_slide;
    // 이미지 카드 관련
    @api imgCardShowOnly;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;

    //자식 컴포넌트
    scFileRelatedListHeader
    scFileRelatedListBody
    scFileRelatedListTable
    scFileRelatedListThumbnail
    scFileRelatedListCard
    scFileRelatedListSlide

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
    }

    initSetting() {
        this.customClass += 'themeColor_' + this.themeColor;
        this.slideDelayTime = this.slideDelayTime * 1000;
    }

    async getInitFileData() {
        try {
            const params = {
                recordId: this.recordId,
                category: this.category,
            };

            const processedData = await this.getFileDataFromServer(params);
            this.updateFileData(processedData);
            this.setChildComponent();
            this.handleDefaultViewType();

            return processedData;
        } catch (error) {
            console.error('getFileData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error.message);
            this.clearFileData();
        }
    }

    async getFileDataFromServer(params) {
        try {
            const result = await getFileData(params); //from apex
            console.log(' result : ', JSON.stringify(result, null, 2));

            const processedFileData = result.Result
                .slice(0, this.countRecord)
                .map((fileData, index) => this.processFileData(fileData, index));

            console.log(' 정제 후 데이터 : ', JSON.stringify(processedFileData, null, 2));

            this.objectApiName = result.ObjectApiName;

            return processedFileData;
        } catch (error) {
            throw error;
        }
    }
    
    setChildComponent() {
        if (this.actSectionOpen) {
            this.scFileRelatedListHeader = this.template.querySelector('c-sc-file-related-list-header');
            this.scFileRelatedListBody = this.template.querySelector('c-sc-file-related-list-body');
            this.scFileRelatedListTable = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListTable;
            this.scFileRelatedListThumbnail = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListThumbnail;
            this.scFileRelatedListCard = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListCard;
            this.scFileRelatedListSlide = this.template.querySelector('c-sc-file-related-list-body').scFileRelatedListSlide;
        }
    }

    handleDefaultViewType() {
        switch (this.defaultViewType) {
            case '이미지 카드':
                this.handleImageCard();
                break;
            case '슬라이드':
                this.handleSlide();
                break;
            default:
                break;
        }
    }

    handleImageCard() {
        this.filterImageData();
        
        if (this.scFileRelatedListCard) {
            this.scFileRelatedListCard.calculateImageSize(this.fileData);
        } 
    }
    
    filterImageData() {
        if (this.imgCardShowOnly) {
            this.fileData = this.fileData.filter(item => item.isImage === true);
        }
    }

    handleSlide() {
        if (this.fileData && this.fileData.length > 0) {
            setTimeout(() => {
                this.scFileRelatedListSlide.showFirstImage();
                this.scFileRelatedListSlide.handleSlidePlay();
            }, 0);
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
            this.originalFileData = [...this.fileData];

            this.fileCount = this.fileData.length;
            this.updateLatestCreatedDate(this.fileData);

            //카트 컴포넌트 이미지 크기 계산
            if (this.scFileRelatedListCard) {
                this.scFileRelatedListCard.calculateImageSize(this.fileData);
            }

        } catch (error) {
            console.error('Error in handleAfterUploadFile: ', error);
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

            console.log('getAfterUploadData latestCreatedDate value:', this.latestCreatedDate);
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
            Owner: fileData.Owner.Name,
            SharingOption: fileData.SharingOption,      //레코드 공유 옵션 (A: 누구나 액세스 가능, R: 역할 기반 액세스, U: 사용자 액세스 제어 목록 기반 액세스, N: 공유되지 않음)
            SharingPrivacy: fileData.SharingPrivacy,    //레코드의 공유 범위 (N: 네트워크 전용, P: 포탈 공유, O: 조직 전체 공유)
            PathOnClient: fileData.PathOnClient,        //파일 이름
            ContentBodyId: fileData.ContentBodyId,
            FileType: fileData.FileType,
            PublishStatus: fileData.PublishStatus,      //컨텐츠의 게시 상태 (P: 게시됨, R: 작업용, A: 아카이브됨)
            ContentSize: this.formatFileSize(fileData.ContentSize),
            FileExtension: "." + fileData.FileExtension,
            VersionDataUrl: fileData.VersionDataUrl,
            CreatedDate: this.formatDate(fileData.CreatedDate),
            LastModifiedDate: this.formatDate(fileData.LastModifiedDate),
            index: index + 1
        };
        fileDataArr.ImgSrc = this.getImgSrc(fileData);

        const isImage = this.isImageFile(fileData.FileExtension);
        const iconName = isImage ? null : this.getFileExtensionIconName(fileData.FileExtension);

        return {
            ...fileDataArr,
            isImage,
            iconName,
        };
    }

    formatFileSize(sizeInBytes) {
        const KB = 1024;
        const MB = KB * 1024;

        return sizeInBytes < MB
            ? `${(sizeInBytes / KB).toFixed(2)} KB`
            : `${(sizeInBytes / MB).toFixed(2)} MB`;
    }

    formatDate(dateString) {
        const options = {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            hour12: true
        };

        return new Date(dateString).toLocaleString('ko-KR', options);
    }

    getImgSrc(fileData) {
        const origin = window.location.origin;
        const ImageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        const DocumentExtensions = ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt'];

        let renditionValue = 'ORIGINAL_';

        if (ImageExtensions.includes(fileData.FileExtension)) {
            renditionValue += fileData.FileExtension;
        } else if (DocumentExtensions.includes(fileData.FileExtension)) {
            renditionValue = 'SVGZ';
        } else {
            //
        }

        return origin +
            '/sfc/servlet.shepherd/version/renditionDownload?rendition=' + renditionValue +
            '&versionId=' + fileData.Id +
            '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId +
            '&page=0';
    }

    isImageFile(fileExtension) {
        if (fileExtension == null) { return }
        const ImageExtensions = ['png', 'jpg', 'jpeg', 'gif'];
        return ImageExtensions.includes(fileExtension.toLowerCase());
    }

    getFileExtensionIconName(fileExtension) {
        const fileExtensionIconMap = {
            'pdf': 'doctype:pdf',
            'doc': 'doctype:word',
            'docx': 'doctype:word',
            'xls': 'doctype:excel',
            'xlsx': 'doctype:excel',
            'ppt': 'doctype:ppt',
            'pptx': 'doctype:ppt',
            'txt': 'doctype:txt'
            // 다른 확장자에 대한 아이콘 매핑 추가
        };

        return fileExtensionIconMap[fileExtension.toLowerCase()] || 'doctype:unknown';

    }

    updateFileData(processedData) {
        this.fileCount = processedData.length;
        this.fileData = processedData;
        this.originalFileData = processedData;

        this.updateLatestCreatedDate(this.fileData);
    }

    updateLatestCreatedDate() {
        const currentTime = new Date().toISOString();

        if (!this.latestCreatedDate || currentTime > this.latestCreatedDate) {
            this.latestCreatedDate = currentTime;
        }

        console.log('updateLatestCreatedDate latestCreatedDate value:', this.latestCreatedDate);
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

        this.originalFileData = [...this.fileData];
        this.scFileRelatedListBody.resetCheckboxInComp();
    }

    handleCheckboxChange(event) {
        const { selectedId, isChecked } = event.detail;

        if (isChecked) {
            this.selectedRowIds = [...this.selectedRowIds, selectedId];
        } else {
            this.selectedRowIds = this.selectedRowIds.filter(id => id !== selectedId);
        }

        console.log(' 컨테이너 : this.selectedRowIds:', JSON.stringify(this.selectedRowIds, null, 2));
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
        const searchKey = event.detail.toLowerCase();
        this.fileData = this.filterAndIndexData(searchKey);
        this.updateUI();
    }

    filterAndIndexData(searchKey) {
        let filteredData;

        if (searchKey === '') {
            filteredData = this.originalFileData;
        } else {
            filteredData = this.originalFileData.filter(file =>
                file.Title.toLowerCase().includes(searchKey)
            );
        }

        return filteredData.map((file, index) => ({
            ...file,
            index: index + 1
        }));
    }

    updateUI() {
        try {
            if (this.scFileRelatedListCard) {
                this.scFileRelatedListCard.calculateImageSize(this.fileData);
                this.scFileRelatedListSlide.showFirstImage();
            }
        } catch (error) {
            console.error('UI 업데이트 중 오류 발생:', error.message);
        }
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

    handleImgTabDataUpdate(event) {
        this.fileData = event.detail.fileData;
    }

    // 변환된 날짜를 서버에 다시 저장하고 싶을 때 사용
    convertToISOString(formattedDate) {
        // 'YYYY-MM-DD HH:mm' 형식의 문자열을 파싱
        const [datePart, timePart] = formattedDate.split(' ');
        const [year, month, day] = datePart.split('-');
        const [hour, minute] = timePart.split(':');

        // Date 객체 생성
        const date = new Date(year, month - 1, day, hour, minute);

        // ISO 문자열로 변환
        return date.toISOString();
    }

}