import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

/**
 * @file scFileRelatedListThumbnail.js
 * @description 파일 관련 썸네일 리스트 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css CSS 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListThumbnail extends NavigationMixin(LightningElement) {
    // property
    @api actNo;
    @api thumbnailComponentHeight;
    // data
    @api fileData;
    @api selectedRowIds;

    //ScFileRelatedListBody 에서 호출하기 위해 @api 추가
    @api resetCheckboxAll() {
        const checkboxes = this.template.querySelectorAll('.checkbox-item');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        //to scFileRelatedListContainer
        this.dispatchEvent(new CustomEvent('clearrowids', {
            bubbles: true,
            composed: true
        }));
    }
    selectedFileId;

    thumbnailThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index', customClass: 'slds-col_padded th_index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox', customClass: 'slds-col_padded th_checkbox' },
        { label: '썸네일', fieldName: 'thumbnail', sortable: false, type: 'thumbnail', customClass: 'slds-col_padded th_thumbnail' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data', customClass: 'slds-col_padded th_title' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data', customClass: 'slds-col_padded th_extension' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data', customClass: 'slds-col_padded th_size' }
    ];

    connectedCallback() {
    }

    renderedCallback() {
        this.handleThumbnailComponentHeight();
    }

    handleThumbnailComponentHeight() {
        const thumbnailBox = this.template.querySelector('.viewType_Thumbnail');

        if (thumbnailBox) {
            thumbnailBox.style.maxHeight = this.thumbnailComponentHeight;
        }
    }

    handleCheckbox(event) {
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.thumbnailTable tbody lightning-input');
        const headerCheckbox = this.template.querySelector('.thumbnailTable thead lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);

        if (headerCheckbox) {
            headerCheckbox.checked = allChecked;
        }

        this.dispatchEvent(new CustomEvent('checkboxchange', {
            detail: { selectedId, isChecked },
            bubbles: true,  // 이벤트 버블링 허용
            composed: true  // 컴포넌트 경계를 넘어 이벤트 전파 허용
        }));
    }

    handleCheckboxAll(event) {
        const selectedIds = [];
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.thumbnailTable tbody lightning-input');

        rowCheckboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const selectedId = checkbox.dataset.id;
            selectedIds.push(selectedId);
        });

        this.dispatchEvent(new CustomEvent('checkboxchangeall', {
            detail: { selectedIds, isChecked },
            bubbles: true,
            composed: true
        }));
    }

    handleThumbnailClick(event) {
        this.selectedFileId = event.target.dataset.id;
        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === this.selectedFileId);
        const selectedFileDocId = selectedFile.ContentDocumentId;
        console.log('table handleThumbnailClick selectedFileDocId >>, ', JSON.stringify(selectedFileDocId));

        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                recordIds: selectedFileDocId
            }
        });
    }

    /**
     * 확장된 썸네일 테이블 헤더 구성을 반환합니다.
     * actNo가 제공되지 않은 경우 'index' 열을 필터링합니다.
     * @returns {Array} 확장된 테이블 헤더 구성
     */
    get extendedThumbnailThead() {
        let result = this.thumbnailThead;

        if (!this.actNo) {
            result = result.filter(th => th.type !== 'index');
        }

        return result.map(th => {
            return {
                ...th,
                isIndex: th.type === 'index',
                isCheckbox: th.type === 'checkbox',
                isThumbnail: th.type === 'thumbnail',
                isData: th.type === 'data'
            };
        });
    }
}