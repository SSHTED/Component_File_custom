// scFileRelatedListContainer.js
import { LightningElement, api } from 'lwc';
import ScFileRelatedListHeader from 'c/scFileRelatedListHeader';
import ScFileRelatedListBody from 'c/scFileRelatedListBody';
import ScFileRelatedListFooter from 'c/scFileRelatedListFooter';

import getInit from '@salesforce/apex/SC_FileRelatedListController.getInit';
import getFileDataByRecordId from '@salesforce/apex/SC_FileRelatedListController.getFileDataByRecordId';
import getFileDataByCategory from '@salesforce/apex/SC_FileRelatedListController.getFileDataByCategory';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';
import saveData from '@salesforce/apex/SC_FileRelatedListController.saveData';

export default class ScFileRelatedListContainer extends LightningElement {
    // 기능 활성화/비활성화
    @api actDeleteBtn;
    @api actDownloadBtn;
    @api actDropZone;
    @api actNo;
    @api actSectionOpen;
    @api actUploadBtn;
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

    defaultViewTypeValue;
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

    tableColumns = [
        { label: '제목', value: 'Title' },
        { label: '파일 형식', value: 'FileType' },
        { label: '크기', value: 'ContentSize' }
    ];
    thumbnailColumns = [
        { label: '이미지', value: 'Image' },
        { label: '제목', value: 'Title' },
        { label: '파일 형식', value: 'FileType' },
        { label: '크기', value: 'ContentSize' }
    ];

    connectedCallback() {
        this.getFileList();

        this.viewType_table = this.viewType_table || this.defaultViewType === '테이블';
        this.viewType_thumbnail = this.viewType_thumbnail || this.defaultViewType === '썸네일';
        this.viewType_card = this.viewType_card || this.defaultViewType === '이미지 카드';
        this.viewType_slide = this.viewType_slide || this.defaultViewType === '슬라이드';

        
    }

    getFileList() {
        if (this.category) {
            // 카테고리 있는 애들 가져오기
            getFileDataByCategory({ category: this.category, recordId: this.recordId })
                .then(result => {
                    console.log('result >>>>>>>>>', result)
                    this.fileData = result.Result.map((fileData, index) => {
                        return {
                            ...fileData,
                            index: index + 1
                        };
                    });
                    console.log('📌 카테고리 있는 fileData 데이터 >>>> ', JSON.stringify(this.fileData, null, 2));
                    this.handleImageSlide();
                })
                .catch(error => {
                    console.error('오류 발생:', error);
                });
        } else {
            // 여기는 카테고리 없는 데이터 가져오기
            getFileDataByRecordId({ recordId: this.recordId })
                .then(result => {
                    console.log('result >>>>>>>>>', result)

                    this.fileCount = result.Result.length;

                    this.fileData = result.Result.map((fileData, index) => {
                        let fileDataArr = {
                            Id: fileData.Id,
                            Title: fileData.Title + '.' + fileData.FileExtension,
                            SharingOption: fileData.SharingOption,
                            SharingPrivacy: fileData.SharingPrivacy,
                            PathOnClient: fileData.PathOnClient,
                            ContentBodyId: fileData.ContentBodyId,
                            FileType: fileData.FileType,
                            PublishStatus: fileData.PublishStatus,
                            ContentSize: (fileData.ContentSize / 1024).toFixed(2),
                            FileExtension: fileData.FileExtension,
                            VersionDataUrl: fileData.VersionDataUrl,
                            CreatedDate: fileData.CreatedDate,
                            index: index + 1
                        };
                        console.log('📌 카테고리 없는 fileData 데이터 >>>> ', JSON.stringify(this.fileData, null, 2));

                        if (fileData.FileExtension == 'png' || fileData.FileExtension == 'jpg' || fileData.FileExtension == 'jpeg') {
                            // fileDataArr.ImgSrc = fileData.VersionDataUrl;
                            fileDataArr.ImgSrc = 'https://dk-smart-component-dev-ed.develop.file.force.com/sfc/servlet.shepherd/version/renditionDownload?rendition=ORIGINAL_' + fileData.FileExtension + '&versionId='
                                + fileData.Id + '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId + '&page=0';
                        } else {
                            fileDataArr.ImgSrc = 'https://dk-smart-component-dev-ed.develop.file.force.com/sfc/servlet.shepherd/version/renditionDownload?rendition=SVGZ&versionId='
                                + fileData.Id + '&operationContext=CHATTER&contentId=' + fileData.ContentBodyId + '&page=0';
                        };


                        let imgElement = new Image();
                        imgElement.src = fileDataArr.ImgSrc;

                        imgElement.onload = () => {
                            let aspectRatio = imgElement.width / imgElement.height;
                            let height = 230 / aspectRatio;

                            fileDataArr.className = height > 250 ? 'card card_x_large' :
                                height > 180 ? 'card card_large' :
                                    height > 130 ? 'card card_medium' :
                                        'card card_small';
                        }
                        return fileDataArr;
                    });
                    this.handleImageSlide();
                })
                .catch(error => {
                    console.error('오류 발생:', error);
                });
        }
    }


    // 파일 업로드 처리
    handleFileUpload() {
        // 파일 업로드 로직 구현
    }

    // 선택 다운로드 처리
    handleDownloadSelected() {
        // 선택 다운로드 로직 구현
    }

    // 선택 삭제 처리
    handleDeleteSelected() {
        // 선택 삭제 로직 구현
    }

    // 정렬 기준 처리
    handleSortedBy(event) {
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