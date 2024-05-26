// scFileRelatedListHeader.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListHeader extends LightningElement {
    @api title;
    @api icon;
    @api actUploadBtn;
    @api actDownloadBtn;
    @api actDeleteBtn;
    @api tableToggleIcon;

    // 데이터
    @api fileData;
    @api selectedRowIds;

    isVisibleActionBtn;
    isDownloading = false;


    connectedCallback() {
        if(this.actUploadBtn || this.actDownloadBtn || this.actDeleteBtn) {
            this.isVisibleActionBtn = true;
        }
        console.log('헤더. actUploadBtn: ', this.actUploadBtn);
        console.log('헤더. actDownloadBtn: ', this.actDownloadBtn);
        console.log('헤더. actDeleteBtn: ', this.actDeleteBtn);
        console.log('헤더. selectedRowIds: ', this.selectedRowIds);
        console.log('헤더. fileData: ', this.fileData);

    }

    handleUploadBtnClick() {
        this.dispatchEvent(new CustomEvent('uploadbtnclick'));
    }

    handleDownloadBtnClick() {
        console.log('헤더. handleDownloadBtnClick');
        console.log('헤더. selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));

        if (this.selectedRowIds.length === 0) {
            alert('다운로드할 항목을 선택해주세요.');
            return;
        }

        if (this.isDownloading) {
            alert('이미 다운로드 중입니다.');
            return;
        }

        this.isDownloading = true;

        const selectedFiles = this.fileData.filter(file => this.selectedRowIds.includes(file.Id));
        let index = 0;

        const downloadNextFile = () => {
            if (index >= selectedFiles.length) {
                this.isDownloading = false;
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
            setTimeout(downloadNextFile, 500);
        };

        downloadNextFile();
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

    get tableToggleIcon() {
        return this.isTableVisible ? 'utility:chevronup' : 'utility:chevrondown';
    }
}