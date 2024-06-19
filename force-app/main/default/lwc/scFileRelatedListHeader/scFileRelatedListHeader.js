import { LightningElement, api } from 'lwc';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';

/**
 * @file scFileRelatedListHeader.js
 * @description 파일 관련 슬라이드 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규

 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListHeader extends LightningElement {
    // property
    @api recordId;
    @api title;
    @api icon;
    @api actUploadBtn;
    @api actDownloadBtn;
    @api actDeleteBtn;
    @api tableToggleIcon;
    @api actSectionOpen;
    @api sortOptions;
    @api category;
    // 데이터
    @api fileData;
    @api selectedRowIds;
    @api activeTabValue;

    downloadProgress = 0;
    totalFilesToDownload = 0;
    isDropdownVisible;
    isDownloading = false;
    isDownloadEnd = false;
    isShowUploadModal = false;
    isShowDownloadModal = false;
    isSortBtnClick = false;
    isComponentSizeSmall = false;
    hasInitialLogicExecuted = false;
    isSortAscending = false;
    isFilter = false;

    sortDirection = {};

    connectedCallback() {
        // 드롭다운의 표시 여부 결정
        this.isDropdownVisible = this.actUploadBtn || this.actDownloadBtn || this.actDeleteBtn;
    }

    renderedCallback() {
        this.updateComponentSize();
    }

    // 컴포넌트가 렌더링된 후 초기 사이즈 결정 로직 실행
    updateComponentSize() {
        if (this.hasInitialLogicExecuted) {
            return;
        }

        const mainDataElement = this.template.querySelector('.slds-card__header');

        if (!mainDataElement) {
            console.log('updateComponentSize mainDataElement >>>>> null');
            return;
        }

        const mainDataWidth = mainDataElement.offsetWidth;
        this.isComponentSizeSmall = mainDataWidth <= 930;

        this.hasInitialLogicExecuted = true;
        console.log('this.isComponentSizeSmall: ', this.isComponentSizeSmall);

        this.dispatchEvent(new CustomEvent('iscomponentsizesmall', {
            detail: { isComponentSizeSmall: this.isComponentSizeSmall }
        }));
    }

    handleSearch(event) {
        const searchKey = event.target.value;
        console.log('검색어 =========> ', searchKey);
        
        //to scFileRelatedListContainer
        this.dispatchEvent(new CustomEvent('search', {
            detail: searchKey
        }))
    }

    handleFileUploadBtnClick() {
        this.isShowUploadModal = !this.isShowUploadModal;
    }

    async handleDownloadBtnClick() {
        console.log('헤더. 다운 selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
        console.log('선택된 탭: ', this.activeTabValue);

        // 선택이 필요한지 여부 확인
        const isSelectionRequired = this.isSelectionExemptTab(this.activeTabValue);
        const hasSelectedRows = this.selectedRowIds.length > 0;

        if (!isSelectionRequired && !hasSelectedRows) {
            alert('다운로드할 항목을 선택해주세요.');
            return;
        }

        if (isSelectionRequired) {
            this.selectedRowIds = this.fileData.map(file => file.Id);
        }

        if (!confirm('다운로드 하시겠습니까?')) {
            return;
        }

        const selectedFiles = this.fileData.filter(file => this.selectedRowIds.includes(file.Id));
        this.totalFilesToDownload = selectedFiles.length;
        this.isShowDownloadModal = true;
        this.isDownloadCancelled = false;
        this.isDownloadEnd = false;
        this.downloadProgress = 0;

        for (let index = 0; index < selectedFiles.length; index++) {
            if (this.isDownloadCancelled) {
                break;
            }

            const file = selectedFiles[index];
            await this.downloadFile(file);
            this.downloadProgress = index + 1;
        }

        this.isDownloadEnd = true;
    }

    downloadFile(file) {
        return new Promise((resolve) => {
            const downloadLink = document.createElement('a');
            downloadLink.href = file.VersionDataUrl;
            downloadLink.download = file.Title;
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            setTimeout(resolve, 500);
        });
    }

    // 선택 예외 탭인지 확인
    isSelectionExemptTab(activeTabValue) {
        const SELECTION_EXEMPT_TABS = ['viewType_card', 'viewType_slide'];
        return SELECTION_EXEMPT_TABS.includes(activeTabValue);
    }

    async handleDeleteBtnClick() {
        console.log('헤더. 삭제 selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));

        if (this.selectedRowIds.length === 0) {
            alert('삭제할 항목을 선택해주세요.');
            return;
        }

        const confirmDelete = confirm('선택한 항목을 삭제하시겠습니까?');
        if (!confirmDelete) {
            return;
        }

        try {
            const result = await deleteFilesByRecordId({
                recordId: this.recordId,
                deleteIdList: JSON.stringify(this.selectedRowIds)
            });

            console.log('삭제 결과:', result);

            if (result.Result) {
                console.log('삭제된 항목 수:', result.Count);
                this.updateFileDataAfterDelete();
                this.dispatchAfterDeleteEvent();
            } else {
                console.error('삭제 실패');
                alert('항목 삭제에 실패했습니다.');
            }
        } catch (error) {
            console.error('삭제 요청 실패:', error.message);
            alert('항목 삭제 요청에 실패했습니다.');
        }
    }

    // 삭제 후 파일 데이터 업데이트
    updateFileDataAfterDelete() {
        this.fileData = this.fileData.filter(item => !this.selectedRowIds.includes(item.Id));
        // console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2));
        console.log('삭제 후 레코드 총 갯수: ', this.fileData.length);
        this.selectedRowIds = [];
    }

    dispatchAfterDeleteEvent() {
        this.dispatchEvent(new CustomEvent('afterdeletefile', { detail: this.fileData }));
    }

    // 정렬 버튼 클릭 핸들러
    handleSortBtnClick(event) {
        const sortBy = event.detail.value;
        this.isSortBtnClick = true;
        this.isSortAscending = !this.isSortAscending;

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
                sortDirection: this.sortDirection[sortBy],
                isSortBtnClick: this.isSortBtnClick
            }
        }));
    }

    sortData(data, sortBy, sortDirection) {
        return data.sort((a, b) => {
            switch (sortBy) {
                case '파일명': //유니코드 기준 정렬
                    return sortDirection === 'asc'
                        ? a.Title.localeCompare(b.Title, 'ko')
                        : b.Title.localeCompare(a.Title, 'ko');
                case '생성일자':
                    return sortDirection === 'asc'
                        ? new Date(a.CreatedDate) - new Date(b.CreatedDate)
                        : new Date(b.CreatedDate) - new Date(a.CreatedDate);
                case '확장자':
                    return sortDirection === 'asc'
                        ? a.FileExtension.localeCompare(b.FileExtension)
                        : b.FileExtension.localeCompare(a.FileExtension);
                case '크기':
                    const sizeA = parseFloat(a.ContentSize);
                    const sizeB = parseFloat(b.ContentSize);
                    return sortDirection === 'asc'
                        ? sizeA - sizeB
                        : sizeB - sizeA;
                default:
                    return 0;
            }
        });
    }

    // 섹션 토글 처리
    handleExpandToggle() {
        this.actSectionOpen = !this.actSectionOpen;
        this.dispatchEvent(new CustomEvent('expandtoggleclicked', { detail: { actSectionOpen: this.actSectionOpen } }));
    }

    handleCloseModal() {
        this.resetModalStates();
    }

    handleDownloadCancel(event) {
        this.resetModalStates();
        this.isDownloadCancelled = event.detail.isDownloadCancelled;
    }

    resetModalStates() {
        this.isShowUploadModal = false;
        this.isShowDownloadModal = false;
        this.isDownloadEnd = false;
    }

    get tableToggleIcon() {
        return this.actSectionOpen ? 'utility:chevrondown' : 'utility:chevronup';
    }
    get sortDirectionIcon() {
        return this.isSortAscending ? 'utility:arrowdown' : 'utility:arrowup';
    }

    handleFilterbtn() {
        this.isFilter = !this.isFilter;
    }
}