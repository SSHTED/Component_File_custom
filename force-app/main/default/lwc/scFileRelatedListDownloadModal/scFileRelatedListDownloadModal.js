import { LightningElement, api } from 'lwc';

export default class ScFileRelatedDownloadModal extends LightningElement {
    @api downloadProgress;
    @api totalFilesToDownload;
    @api isDownloadEnd;

    connectedCallback() {
    }

    get progress() {
        return (this.downloadProgress / this.totalFilesToDownload) * 100;
    }

    handleCloseModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCancelDownload() {
        this.dispatchEvent(new CustomEvent('downloadcancel', {
            detail: { isDownloadCancelled: true }
        }));
    }

    handleCompleteDownload() {
        this.dispatchEvent(new CustomEvent('close'));
    }
}