// scFileRelatedListHeader.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListHeader extends LightningElement {
    @api title;
    @api icon;
    @api actUploadBtn;
    @api actDownloadBtn;
    @api actDeleteBtn;
    @api tableToggleIcon;

    handleUploadBtnClick() {
        this.dispatchEvent(new CustomEvent('uploadbtnclick'));
    }

    handleDownloadBtnClick() {
        this.dispatchEvent(new CustomEvent('downloadbtnclick'));
    }

    handleDeleteBtnClick() {
        this.dispatchEvent(new CustomEvent('deletebtnclick'));
    }

    handleSortedByClicked(event) {
        this.dispatchEvent(new CustomEvent('sortedbyclicked', { detail: event.detail.value }));
    }

    handleTableToggleClicked() {
        this.dispatchEvent(new CustomEvent('tabletoggleclicked'));
    }
}