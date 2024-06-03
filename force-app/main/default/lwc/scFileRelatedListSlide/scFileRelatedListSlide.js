// scFileRelatedListSlide.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListSlide extends LightningElement {
    @api fileData;
    @api isSmallSizeBox;
    @api selectedRowIds;

    imgSrc;
    imgTitle;
    slideInterval;
    togglePlayIcon = 'utility:play';
    isPlaying = false;

    connectedCallback(){

    }

    previousImage() {
        const currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);

        if(currentIndex > 0){
            // 이전 이미지로 이동
            const previousFile = this.fileData[currentIndex - 1];
            this.imgSrc = previousFile.ImgSrc;
            this.imgTitle = previousFile.Title;
        }else{
            // 첫 번째 이미지인 경우 마지막 이미지로 이동
            const lastFile = this.fileData[this.fileData.length - 1];
            this.imgSrc = lastFile.ImgSrc;
            this.imgTitle = lastFile.Title;
        }
    }

    handlePlaying() {
        if (this.isPlaying) {
            // 슬라이드 일시정지
            clearInterval(this.slideInterval);
            this.isPlaying = false;
            this.togglePlayIcon = 'utility:play';
        } else {
            // 슬라이드 재생
            this.slideInterval = setInterval(() => {
                this.nextImage();
            }, 3000); // 3초마다 다음 이미지로 이동
            this.isPlaying = true;
            this.togglePlayIcon = 'utility:pause';
        }
    }

    nextImage() {
        const currentIndex = this.fileData.findIndex(file => file.ImgSrc === this.imgSrc);
        if(currentIndex < this.fileData.length - 1) {
            // 다음 이미지로 이동
            const nexFile = this.fileData[currentIndex + 1];
            this.imgSrc = nexFile.ImgSrc;
            this.imgTitle = nexFile.Title;
        }else{
            // 마지막 이미지인 경우 첫 번째 이미지로 이동
            const firstFile = this.fileData[0];
            this.imgSrc = firstFile.ImgSrc;
            this.imgTitle = firstFile.Title;
        }
    }
    
    handleThumbnailClick(event) {
        // 클릭한 썸네일 이미지의 인덱스 가져오기 (10은 10진법), 일반적으로 HTML 데이터 속성에서 가져오는 값은 문자열 형태
        const index = parseInt(event.currentTarget.dataset.index, 10);
        
        // 해당 인덱스의 이미지로 이동
        const selectedFile = this.fileData[index];
        this.imgSrc = selectedFile.ImgSrc;
        this.imgTitle = selectedFile.Title;
      }

    showImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'block';

    }

    hideImgInfo() {
        this.template.querySelector('.slideImgInfo').style.display = 'none';
    }
}