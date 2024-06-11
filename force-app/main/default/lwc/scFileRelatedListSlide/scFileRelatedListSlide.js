// scFileRelatedListSlide.js
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ScFileRelatedListSlide extends NavigationMixin(LightningElement) {
    @api fileData;
    @api componentSizeisBig;
    @api selectedRowIds;
    @api isComponentSizeSmall;
    @api slideDelayTime;

    imgId;
    imgSrc;
    imgTitle;
    slideInterval;
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

    nextImage() {
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

    handleTitleClick(event) {
        this.handleSlidePlayStop();
        
        this.selectedFileId = event.target.dataset.id;
        console.log('slide handleThumbnailClick this.selectedFileId >>, ', this.selectedFileId);

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === this.selectedFileId);
        console.log('table handleThumbnailClick selectedFile >>, ', JSON.stringify(selectedFile));

        const selectedFileDocId = selectedFile.ContentDocumentId;
        console.log('table handleThumbnailClick selectedFileDocId >>, ', JSON.stringify(selectedFileDocId));

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

    showImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'block';
    }

    hideImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'none';
    }


    // 필요 시 사용
    // setImageData(imgSrc, imgTitle) {
    //     this.imgSrc = imgSrc;
    //     this.imgTitle = imgTitle;
    // }
}