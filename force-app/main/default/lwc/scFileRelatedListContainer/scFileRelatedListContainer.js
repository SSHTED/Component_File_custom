// scFileRelatedListContainer.js
import { LightningElement, api } from 'lwc';
import ScFileRelatedListHeader from 'c/scFileRelatedListHeader';
import ScFileRelatedListBody from 'c/scFileRelatedListBody';
import ScFileRelatedListFooter from 'c/scFileRelatedListFooter';

// import getFileDataByRecordId from '@salesforce/apex/SC_FileRelatedListController.getFileDataByRecordId';
// import getFileDataByCategory from '@salesforce/apex/SC_FileRelatedListController.getFileDataByCategory';
import getFileData from '@salesforce/apex/SC_FileRelatedListController.getFileData';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';
import saveData from '@salesforce/apex/SC_FileRelatedListController.saveData';

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

    selectedRowIds = [];


    currentViewType;
    customClass = '';
    fileCount;
    isTableVisible = true;
    isPlaying = true;
    intervalId = null;

    isSorted = false;
    sortCriteria;
    isDescending;
    sortOrder;
    isDebug = true;
    isLogicExecuted = false;
    isSmallSizeBox = false;
    isVisibleActionBtn;

    fileData = [];
    imgTitle;
    imgSrc;

    connectedCallback() {
        this.fetchFileData();
        this.logCheckSetting();
    }

    logCheckSetting() {
        console.log('actSectionOpen: ', this.actSectionOpen);
    }

    fetchFileData() {
        const params = { recordId: this.recordId };
        if (this.category) {
            params.category = this.category;
        }

        getFileData(params)
            .then(result => {
                console.log('getFileData result >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', result);
                this.fileCount = result.Result.length;
                this.fileData = result.Result.map((fileData, index) => this.processFileData(fileData, index));

                console.log('this.fileData: ', JSON.stringify(this.fileData, null, 2));

                this.handleImageSlide();
            })
            .catch(error => {
                console.log('getFileData error >>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>: ', error);
            });
    }

    processFileData(fileData, index) {
        let fileDataArr = {
            Id: fileData.Id,
            Title: fileData.Title + '.' + fileData.FileExtension,
            SharingOption: fileData.SharingOption,  //레코드 공유 옵션 (A: 누구나 액세스 가능, R: 역할 기반 액세스, U: 사용자 액세스 제어 목록 기반 액세스, N: 공유되지 않음)
            SharingPrivacy: fileData.SharingPrivacy,    //레코드의 공유 범위 (N: 네트워크 전용, P: 포탈 공유, O: 조직 전체 공유)
            PathOnClient: fileData.PathOnClient, //파일 이름
            ContentBodyId: fileData.ContentBodyId,
            FileType: fileData.FileType,
            PublishStatus: fileData.PublishStatus,  //컨텐츠의 게시 상태 (P: 게시됨, R: 작업용, A: 아카이브됨)
            ContentSize: (fileData.ContentSize / 1024).toFixed(2),
            FileExtension: fileData.FileExtension,
            VersionDataUrl: fileData.VersionDataUrl,
            CreatedDate: fileData.CreatedDate,
            index: index + 1
        };
        fileDataArr.ImgSrc = this.getImgSrc(fileData);

        this.calculateImageSize(fileDataArr);

        return fileDataArr;
    }

    getImgSrc(fileData) {
        if (fileData.FileExtension == 'png' || fileData.FileExtension == 'jpg' || fileData.FileExtension == 'jpeg') {
            return 'https://dk-smart-component-dev-ed.develop.file.force.com/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_' + fileData.FileExtension + '&versionId=' + fileData.Id + '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId + '&page=0';
        } else {
            return 'https://dk-smart-component-dev-ed.develop.file.force.com/sfc/servlet.shepherd/version/renditionDownload?rendition=SVGZ&versionId=' + fileData.Id + '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId + '&page=0';
        }
    }

    calculateImageSize(fileDataArr) {
        let imgElement = new Image();
        imgElement.src = fileDataArr.ImgSrc;
        imgElement.onload = () => {
            let aspectRatio = imgElement.width / imgElement.height;
            let height = 230 / aspectRatio;
            fileDataArr.imgCardClass = height > 250 ? 'card card_x_large' :
                height > 180 ? 'card card_large' :
                    height > 130 ? 'card card_medium' :
                        'card card_small';
        };
    }


    // 파일 업로드 처리
    handleFileUpload() {
        // 파일 업로드 로직 구현
    }

    handleCheckboxChange(event) {
        const { selectedId, isChecked} = event.detail;

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

    handleHeaderCheckboxChange(event) {
        const { checked } = event.detail;
        this.template.querySelector('.dataTable thead lightning-input').checked = checked;
    }

    handleDownloadSelected() {
        const activeTab = this.viewTypeTabs.find(tab => tab.value === this.defaultViewTypeValue);

        if (activeTab.isTable) {
            const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');
            rowCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    this.selectedRowIds.push(checkbox.dataset.id);
                }
            });
        } else if (activeTab.isThumbnail) {
            const rowCheckboxes = this.template.querySelectorAll('.thumbnailTable tbody lightning-input');
            rowCheckboxes.forEach(checkbox => {
                if (checkbox.checked) {
                    this.selectedRowIds.push(checkbox.dataset.id);
                }
            });
        }
        console.log('선택한 쳌밬', JSON.stringify(this.selectedRowIds, null, 2));

        if (this.selectedRowIds.length === 0) {
            alert('다운로드할 항목을 선택해주세요.');
            return;
        }

        // 선택한 파일 데이터 필터링
        const selectedFiles = this.fileData.filter(file => this.selectedRowIds.includes(file.Id));

        // 파일 데이터를 사용하여 다운로드 시작
        let index = 0;
        const downloadNextFile = () => {
            if (index >= selectedFiles.length) {
                return;
            }

            const file = selectedFiles[index];
            const downloadLink = document.createElement('a');
            downloadLink.href = file.VersionDataUrl;
            downloadLink.download = file.Title;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            index++;
            setTimeout(downloadNextFile, 500);
        };

        downloadNextFile();
    }

    // 선택 삭제 처리
    handleDeleteSelected() {
        // 선택 삭제 로직 구현
    }

    // 정렬 기준 처리
    handleSortedBy(event) {
        const sortBy = event.detail;

        // 정렬 기준 로직 구현
    }

    // 테이블 토글 처리
    handleTableToggle() {
        // 테이블 토글 로직 구현
    }

    // 뷰 타입 변경 처리
    handleViewTypeChange(event) {
        // 뷰 타입 변경 로직 구현
    }

    // 정렬 순서 변경 처리
    handleSortedByDesc() {
        // 정렬 순서 변경 로직 구현
    }

    // 체크박스 클릭 처리
    handleCheckboxClick(event) {
        // 체크박스 클릭 로직 구현
    }

    // 이미지 카드 액션 처리
    handleCellEvent(event) {
        // 이미지 카드 액션 로직 구현
    }

    // 이미지 카드 마우스오버 처리
    showButton() {
        // 이미지 카드 마우스오버 로직 구현
    }

    // 이미지 카드 마우스아웃 처리
    hideButton() {
        // 이미지 카드 마우스아웃 로직 구현
    }

    // 슬라이드 썸네일 클릭 처리
    handleThumbnailClick(event) {
        // 슬라이드 썸네일 클릭 로직 구현
    }

    // 이전 이미지로 이동 처리
    previousImage() {
        // 이전 이미지로 이동 로직 구현
    }

    // 슬라이드 재생/일시정지 처리
    handlePalying() {
        // 슬라이드 재생/일시정지 로직 구현
    }

    // 다음 이미지로 이동 처리
    nextImage() {
        // 다음 이미지로 이동 로직 구현
    }

    // 슬라이드 이미지 정보 표시 처리
    showImgInfo() {
        // 슬라이드 이미지 정보 표시 로직 구현
    }

    // 슬라이드 이미지 정보 숨김 처리
    hideImgInfo() {
        // 슬라이드 이미지 정보 숨김 로직 구현
    }
}