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
        console.log('scFileRelatedListSlide isComponentSizeSmall : ', this.isComponentSizeSmall)
        console.log('scFileRelatedListSlide slideDelayTime : ', this.slideDelayTime)
    }

    renderedCallback() {
    }

    previousImage() {
        const currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);

        if (currentIndex > 0) {
            // 이전 이미지로 이동
            const previousFile = this.fileData[currentIndex - 1];
            this.imgId = previousFile.Id;
            this.imgSrc = previousFile.ImgSrc;
            this.imgTitle = previousFile.Title;
        } else {
            // 첫 번째 이미지인 경우 마지막 이미지로 이동
            const lastFile = this.fileData[this.fileData.length - 1];
            this.imgId = lastFile.Id;
            this.imgSrc = lastFile.ImgSrc;
            this.imgTitle = lastFile.Title;
        }
    }

    @api handleSlidePlay() {
        console.log('handleSlidePlay');
        if (this.isPlaying) {
            // 슬라이드 일시정지
            clearInterval(this.slideInterval);
            this.isPlaying = false;
            this.togglePlayIcon = 'utility:play';
        } else {
            // 슬라이드 재생
            this.slideInterval = setInterval(() => {
                this.nextImage();
            }, this.slideDelayTime); // 슬라이드 재생 속도
            this.isPlaying = true;
            this.togglePlayIcon = 'utility:pause';
        }
    }

    @api handleSlidePlayStop() {
        console.log('handleSlidePlayStop');

        if (this.isPlaying) {
            clearInterval(this.slideInterval);
            this.isPlaying = false;
            this.togglePlayIcon = 'utility:play';
        }
    }

    @api nextImage() {
        const currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);
        if (currentIndex < this.fileData.length - 1) {
            // 다음 이미지로 이동
            const nexFile = this.fileData[currentIndex + 1];
            this.imgId = nexFile.Id;
            this.imgSrc = nexFile.ImgSrc;
            this.imgTitle = nexFile.Title;
        } else {
            // 마지막 이미지인 경우 첫 번째 이미지로 이동
            const firstFile = this.fileData[0];
            this.imgId = firstFile.Id;
            this.imgSrc = firstFile.ImgSrc;
            this.imgTitle = firstFile.Title;
        }
    }

    handleThumbnailClick(event) {
        // 클릭한 썸네일 이미지의 인덱스 가져오기 (10은 10진법), 일반적으로 HTML 데이터 속성에서 가져오는 값은 문자열 형태
        const index = parseInt(event.currentTarget.dataset.index, 10);

        // 해당 인덱스의 이미지로 이동
        const selectedFile = this.fileData[index];
        this.imgId = selectedFile.Id;
        this.imgSrc = selectedFile.ImgSrc;
        this.imgTitle = selectedFile.Title;
    }

    showImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'block';
    }

    hideImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'none';
    }

    handleActionClicked(event) {
        this.handleSlidePlayStop();

        const actionValue = event.currentTarget.dataset.value;
        const selectedFileId = event.currentTarget.dataset.id;

        console.log('Action Value:', actionValue);
        console.log('Selected File ID:', selectedFileId);

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === selectedFileId);
        const selectedFileDocId = selectedFile.ContentDocumentId;
        console.error('이미지 selectedFile:', JSON.stringify(selectedFile, null, 2));


        switch (actionValue) {
            case 'expand':
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        pageName: 'filePreview'
                    },
                    state: {
                        recordIds: selectedFileDocId
                    }
                });
                break;
            
            case 'download':
                if (confirm('다운로드 하시겠습니까?')) {
                    const selectedFiles = this.fileData.filter(file => selectedFileId.includes(file.Id));
                    this.totalFilesToDownload = selectedFiles.length;
                    this.isShowDownloadModal = true;
                    this.isDownloadCancelled = false;
                    this.isDownloadEnd = false;
                    this.downloadProgress = 0;
                    let index = 0;
        
                    const downloadNextFile = () => {
                        if (index >= selectedFiles.length || this.isDownloadCancelled) {
                            this.downloadProgress = this.totalFilesToDownload;
                            this.isDownloadEnd = true;
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
                        this.downloadProgress = index;
                        setTimeout(downloadNextFile, 500);
                    };
                    downloadNextFile();
                }
                break;
            
            case 'delete':
                if (confirm('선택한 항목을 삭제하시겠습니까?')) {
                    deleteFilesByRecordId({ recordId: this.recordId, deleteIdList: selectedFileId })
                        .then(result => {
                            console.log('삭제 결과:', result);
                            if (result.Result) {
                                console.log('삭제된 항목 수:', result.Count);
                                this.fileData = this.fileData.filter(item => !selectedFileId.includes(item.Id));
                                console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2));
                                this.selectedRowIds = [];
                                this.dispatchEvent(new CustomEvent('afterdeletefile', {
                                    detail: this.fileData,
                                    bubbles: true, // 이벤트 버블링 허용
                                    composed: true // 컴포넌트 경계를 넘어 이벤트 전파 허용
                                }));
                                
                            } else {
                                console.error('삭제 실패');
                                alert('항목 삭제에 실패했습니다.');
                            }
                        })
                        .catch(error => {
                            console.error('삭제 요청 실패:', error.message);
                            alert('항목 삭제 요청에 실패했습니다.');
                        });
                }
                this.handleSlidePlay();
                break;
            default:
        }

        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: { id: fileId, action: actionValue } }));
    }

    // 필요 시 사용
    // setImageData(imgSrc, imgTitle) {
    //     this.imgSrc = imgSrc;
    //     this.imgTitle = imgTitle;
    // }
}