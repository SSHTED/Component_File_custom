// scFileRelatedListBody.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListBody extends LightningElement {
    @api viewType;
    @api viewtypeTable;
    @api viewtypeThumbnail;
    @api viewtypeCard;
    @api viewtypeSlide;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    @api fileData;
    @api fileCount;
    @api actNo;

    handleViewTypeChange(event) {
        this.dispatchEvent(new CustomEvent('viewtypechange', { detail: event.target.value }));
    }

    handleCheckboxClick(event) {
        this.dispatchEvent(new CustomEvent('datatablerowselection', { detail: event.detail }));
    }

    handleSortData(event) {
        this.dispatchEvent(new CustomEvent('sortdata', { detail: event.detail }));
    }

    handleThumbnailClick(event) {
        this.dispatchEvent(new CustomEvent('thumbnailclick', { detail: event.detail }));
    }

    handleImgCardActionClicked(event) {
        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: event.detail }));
    }

    handleImgCardMouseOver(event) {
        this.dispatchEvent(new CustomEvent('imgcardmouseover', { detail: event.detail }));
    }

    handleImgCardMouseOut(event) {
        this.dispatchEvent(new CustomEvent('imgcardmouseout', { detail: event.detail }));
    }
}