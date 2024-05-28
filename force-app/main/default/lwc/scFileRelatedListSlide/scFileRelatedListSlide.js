// scFileRelatedListSlide.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListSlide extends LightningElement {
    @api fileData;
    @api isSmallSizeBox;
    @api selectedRowIds;

    imgSrc = '';
    imgTitle = '';
    togglePlayIcon = 'utility:play';

    handleThumbnailClick(event) {
        this.imgSrc = event.currentTarget.dataset.imgUrl;
        this.imgTitle = event.currentTarget.dataset.imgTitle;
    }

    previousImage() {
        // 이전 이미지로 이동 로직 구현
    }

    handlePlaying() {
        // 슬라이드 재생/일시정지 로직 구현
    }

    nextImage() {
        // 다음 이미지로 이동 로직 구현
    }

    showImgInfo() {
        // 슬라이드 이미지 정보 표시 로직 구현
    }

    hideImgInfo() {
        // 슬라이드 이미지 정보 숨김 로직 구현
    }
}