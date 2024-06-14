import { LightningElement, api } from 'lwc';

/**
 * @file ScFileRelatedDownloadModal.js
 * @description 파일 다운로드 모달 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
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