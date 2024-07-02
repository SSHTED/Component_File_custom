import { LightningElement, api } from 'lwc';

/**
 * @file scFileRelatedListTable.js
 * @description 파일 관련 테이블 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListTable extends LightningElement {
    // property
    @api actNo;
    @api tableComponentHeight;
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

    tableThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index', customClass: 'slds-col_padded th_index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox', customClass: 'slds-col_padded th_checkbox' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data', customClass: 'slds-col_padded th_title' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data', customClass: 'slds-col_padded th_extension' },
        { label: '소유자', fieldName: 'Owner', sortable: true, type: 'data', customClass: 'slds-col_padded th_owner' },
        { label: '수정일자', fieldName: 'LastModifiedDate', sortable: true, type: 'data', customClass: 'slds-col_padded th_LastModifiedDate' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data', customClass: 'slds-col_padded th_size' }
    ];

    connectedCallback() {
    }

    renderedCallback() {
        this.handleTableComponentHeight();
    }

    handleTableComponentHeight() {
        const tableBox = this.template.querySelector('.viewType_Table');

        if (tableBox) {
            tableBox.style.maxHeight = this.tableComponentHeight;
        }
    }

    handleCheckbox(event) {
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');
        const headerCheckbox = this.template.querySelector('.dataTable thead lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);

        if (headerCheckbox) {
            headerCheckbox.checked = allChecked;
        }

        this.dispatchEvent(new CustomEvent('checkboxchange', {
            detail: { selectedId, isChecked },
            bubbles: true,
            composed: true
        }));
    }

    handleCheckboxAll(event) {
        const selectedIds = [];
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');

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

    /**
     * 확장된 테이블 헤더 구성을 반환합니다.
     * actNo가 제공되지 않은 경우 'index' 열을 필터링합니다.
     * @returns {Array} 확장된 테이블 헤더 구성
    */
    get extendedTableThead() {
        let result = this.tableThead;

        if (!this.actNo) {
            result = result.filter(th => th.type !== 'index');
        }

        return result.map(th => {
            return {
                ...th,
                isIndex: th.type === 'index',
                isCheckbox: th.type === 'checkbox',
                isData: th.type === 'data'
            };
        });
    }
}