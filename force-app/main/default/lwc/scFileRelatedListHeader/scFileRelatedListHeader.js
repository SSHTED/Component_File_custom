// scFileRelatedListHeader.js
import { LightningElement, api } from 'lwc';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';

export default class ScFileRelatedListHeader extends LightningElement {
    @api recordId;
    @api title;
    @api icon;
    @api actUploadBtn;
    @api actDownloadBtn;
    @api actDeleteBtn;
    @api tableToggleIcon;
    @api actSectionOpen;

    // 데이터
    @api fileData;
    @api selectedRowIds;

    isVisibleActionBtn;
    isDownloading = false;
    isShowModal = false;
    sortDirection = {};

    connectedCallback() {
        if (this.actUploadBtn || this.actDownloadBtn || this.actDeleteBtn) {
            this.isVisibleActionBtn = true;
        }
        console.log('헤더. recordId: ', this.recordId);
        console.log('헤더. actUploadBtn: ', this.actUploadBtn);
        console.log('헤더. actDownloadBtn: ', this.actDownloadBtn);
        console.log('헤더. actDeleteBtn: ', this.actDeleteBtn);
        console.log('헤더. selectedRowIds: ', this.selectedRowIds);
        console.log('헤더. actSectionOpen: ', this.actSectionOpen);
        console.log('헤더. fileData: ', JSON.stringify(this.fileData));

    }

    handleFileUploadBtnClick() {
        this.isShowModal = !this.isShowModal;
    }

    handleDownloadBtnClick() {
        console.log('헤더. handleDownloadBtnClick');
        console.log('헤더. 다운 selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));

        if (this.selectedRowIds.length === 0) {
            alert('다운로드할 항목을 선택해주세요.');
            return;
        }

        if (this.isDownloading) {
            alert('이미 다운로드 중입니다.');
            return;
        }

        if (confirm('선택한 항목을 다운로드 하시겠습니까?')) {
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
    }

    handleDeleteBtnClick() {
        console.log('헤더. handleDeleteBtnClick');
        console.log('헤더. 삭제 selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));

        if (this.selectedRowIds.length === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        if (confirm('선택한 항목을 삭제하시겠습니까?')) {
            deleteFilesByRecordId({ recordId: this.recordId, deleteIdList: JSON.stringify(this.selectedRowIds) })
                .then(result => {
                    console.log('삭제 결과:', result);
                    if (result.Result) {
                        console.log('삭제된 항목 수:', result.Count);
                        this.fileData = this.fileData.filter(item => !this.selectedRowIds.includes(item.Id));
                        console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2))
                        this.selectedRowIds = [];
                        this.dispatchEvent(new CustomEvent('afterdeletefile', { detail: this.fileData }));

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

    }

    handleSortBtnClick(event) {
        const sortBy = event.detail.value;
        let sortedFileData = [...this.fileData];

        this.sortDirection[sortBy] = this.sortDirection[sortBy] === 'asc' ? 'desc' : 'asc';

        sortedFileData = this.sortData(sortedFileData, sortBy, this.sortDirection[sortBy]);
        sortedFileData = sortedFileData.map((file, index) => ({
            ...file,
            index: index + 1
        }));

        this.dispatchEvent(new CustomEvent('sortedbyclicked', {
            detail: {
                sortedData: sortedFileData,
                sortBy: sortBy,
                sortDirection: this.sortDirection[sortBy]
            }
        }));
    }

    sortData(data, sortBy, sortDirection) {
        return data.sort((a, b) => {
            switch (sortBy) {
                case 'sortByName':
                    return sortDirection === 'asc'
                        ? a.Title.localeCompare(b.Title)
                        : b.Title.localeCompare(a.Title);
                case 'sortByCreateDate':
                    return sortDirection === 'asc'
                        ? new Date(a.CreatedDate) - new Date(b.CreatedDate)
                        : new Date(b.CreatedDate) - new Date(a.CreatedDate);
                case 'sortBytype':
                    return sortDirection === 'asc'
                        ? a.FileExtension.localeCompare(b.FileExtension)
                        : b.FileExtension.localeCompare(a.FileExtension);
                default:
                    return 0;
            }
        });
    }

    handleExpandToggle() {
        this.actSectionOpen = !this.actSectionOpen;

        this.dispatchEvent(new CustomEvent('expandtoggleclicked', { detail: { actSectionOpen: this.actSectionOpen } }));
    }

    handleCloseModal() {
        this.isShowModal = false;
    }

    get tableToggleIcon() {
        return this.actSectionOpen ? 'utility:chevrondown' : 'utility:chevronup';
    }
}