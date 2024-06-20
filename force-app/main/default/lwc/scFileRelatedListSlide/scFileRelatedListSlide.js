import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';

/**
 * @file scFileRelatedListSlide.js
 * @description 파일 관련 슬라이드 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규

 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListSlide extends NavigationMixin(LightningElement) {
    @api recordId;
    @api fileData;
    @api selectedRowIds;  // string[]
    @api isComponentSizeSmall;  // boolean
    @api slideDelayTime;

    imgId;
    imgSrc; // string (URL)
    imgTitle;
    slideInterval;     // 슬라이드 간격을 제어하기 위한 인터벌 변수
    isPlaying = false;
    togglePlayIcon = 'utility:play';

    connectedCallback() {

    }

    renderedCallback() {
    }

    @api
    showFirstImage() {
        if (this.fileData.length > 0) {
            const firstFile = this.fileData[0];
            this.imgId = firstFile.Id;
            this.imgSrc = firstFile.ImgSrc;
            this.imgTitle = firstFile.Title;
        }
    }

    imageController(direction) {
        const currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);
        const totalFiles = this.fileData.length;
        let targetIndex;

        if (direction === 'previous') {
            targetIndex = (currentIndex > 0) ? currentIndex - 1 : totalFiles - 1;
        } else if (direction === 'next') {
            targetIndex = (currentIndex < totalFiles - 1) ? currentIndex + 1 : 0;
        }

        const targetFile = this.fileData[targetIndex];
        this.imgId = targetFile.Id;
        this.imgSrc = targetFile.ImgSrc;
        this.imgTitle = targetFile.Title;
    }

    previousImage() {
        this.imageController('previous');
    }

    @api 
    nextImage() {
        this.imageController('next');
    }

    @api 
    handleSlidePlay() {
        if (this.isPlaying) {
            clearInterval(this.slideInterval);

            this.isPlaying = false;
            this.togglePlayIcon = 'utility:play';
        } else {
            this.slideInterval = setInterval(() => {
                this.nextImage();
            }, this.slideDelayTime); // 슬라이드 재생 속도

            this.isPlaying = true;
            this.togglePlayIcon = 'utility:pause';
        }
    }

    @api 
    handleSlidePlayStop() {
        console.log('handleSlidePlayStop');

        if (this.isPlaying) {
            clearInterval(this.slideInterval);
            this.isPlaying = false;
            this.togglePlayIcon = 'utility:play';
        }
    }

    handleSlideNaviClick(event) {
        // 클릭한 썸네일 이미지의 인덱스 가져오기 (10은 10진법), 일반적으로 HTML 데이터 속성에서 가져오는 값은 문자열 형태
        const index = parseInt(event.currentTarget.dataset.index, 10);

        // 해당 인덱스의 이미지로 이동
        const selectedFile = this.fileData[index];
        this.imgId = selectedFile.Id;
        this.imgSrc = selectedFile.ImgSrc;
        this.imgTitle = selectedFile.Title;
    }

    handleActionClicked(event) {
        this.handleSlidePlayStop();

        const actionValue = event.currentTarget.dataset.value;
        const selectedFileId = event.currentTarget.dataset.id;

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === selectedFileId);
        const selectedFileDocId = selectedFile.ContentDocumentId;

        console.log('Action Value:', actionValue);
        console.log('Selected File ID:', selectedFileId);
        console.log('이미지 selectedFile:', JSON.stringify(selectedFile, null, 2));

        switch (actionValue) {
            case 'expand':
                this.handleExpand(selectedFileDocId);
                break;

            case 'download':
                this.handleDownload(selectedFileId);
                break;

            case 'delete':
                this.handleDelete(selectedFileId);
                break;

            default:
        }
    }
    // expand
    handleExpand(selectedFileDocId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                recordIds: selectedFileDocId
            }
        });
    }
    // download
    handleDownload(selectedFileId) {
        if (!confirm('다운로드 하시겠습니까?')) {
            return;
        }

        const selectedFiles = this.fileData.filter(file => selectedFileId.includes(file.Id));
        this.initializeDownload(selectedFiles.length);
        this.downloadFiles(selectedFiles);
    }

    initializeDownload(totalFiles) {
        this.totalFilesToDownload = totalFiles;
        this.isShowDownloadModal = true;
        this.isDownloadCancelled = false;
        this.isDownloadEnd = false;
        this.downloadProgress = 0;
    }

    downloadFiles(selectedFiles) {
        let index = 0;
        const downloadNextFile = () => {
            if (index >= selectedFiles.length || this.isDownloadCancelled) {
                this.finalizeDownload();
                return;
            }

            const file = selectedFiles[index];
            this.downloadFile(file);

            index++;
            this.downloadProgress = index;
            setTimeout(downloadNextFile, 500);
        };
        downloadNextFile();
    }

    downloadFile(file) {
        const downloadLink = document.createElement('a');
        downloadLink.href = file.VersionDataUrl;
        downloadLink.download = file.Title;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    finalizeDownload() {
        this.downloadProgress = this.totalFilesToDownload;
        this.isDownloadEnd = true;
    }

    // delete
    handleDelete(selectedFileId) {
        if (!confirm('선택한 항목을 삭제하시겠습니까?')) {
            return;
        }

        deleteFilesByRecordId({ recordId: this.recordId, deleteIdList: selectedFileId })
            .then(result => this.handleDeleteSuccess(result, selectedFileId))
            .catch(error => this.handleDeleteError(error));

        this.handleSlidePlay();
    }

    handleDeleteSuccess(result, selectedFileId) {
        console.log('삭제 결과:', result);
        if (result.Result) {
            let currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);

            this.fileData = this.fileData.filter(item => !selectedFileId.includes(item.Id));

            console.log('삭제된 항목 수:', result.Count);
            console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2));

            if (this.fileData.length > 0) {
                // 삭제 후에도 이미지가 남아있는 경우
                if (currentIndex >= this.fileData.length) {
                    // 현재 인덱스가 배열의 크기를 벗어난 경우, 마지막 인덱스로 조정
                    currentIndex = this.fileData.length - 1;
                }
                this.imgSrc = this.fileData[currentIndex].ImgSrc;
            } else {
                // 모든 이미지가 삭제된 경우
                this.imgSrc = null; // 또는 기본 이미지 URL로 설정
            }

            this.selectedRowIds = [];

            this.dispatchEvent(new CustomEvent('afterdeletefile', {
                detail: this.fileData,
                bubbles: true,
                composed: true
            }));
        } else {
            console.error('handleDeleteSuccess Error 발생');
        }
    }

    handleDeleteError(error) {
        console.error('삭제 요청 실패:', error.message);
        alert('항목 삭제 요청에 실패했습니다.');
    }

    showImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'block';
    }

    hideImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'none';
    }
}