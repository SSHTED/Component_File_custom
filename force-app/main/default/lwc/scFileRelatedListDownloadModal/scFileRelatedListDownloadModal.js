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
        if(!this.isDownloadEnd){
            if(confirm('파일 다운로드 중입니다. 정말 창을 닫으시겠습니까?')){
                this.handleCancelDownload();
            }
        }else{
            this.dispatchEvent(new CustomEvent('close'));
        }
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