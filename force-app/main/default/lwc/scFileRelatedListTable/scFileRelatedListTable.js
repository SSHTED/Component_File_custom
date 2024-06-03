// scFileRelatedListTable.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListTable extends LightningElement {
    @api fileData;
    @api fileCount;
    @api actNo;
    @api selectedRowIds;
    @api checkboxReset;

    tableThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data' }
    ];

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

    connectedCallback() {
        console.log('ScFileRelatedListTable selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
        console.log('리셋 체크박스', this.checkboxReset);
        console.log('액트 no :', this.actNo);
    }

    handleCheckbox(event) {
        console.log('table handleCheckbox');
        
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        
        const headerCheckbox = this.template.querySelector('.dataTable thead lightning-input');
  
        if (headerCheckbox) {
          headerCheckbox.checked = allChecked;
        }

        console.log('child selectedId: ', selectedId);
        console.log('child isChecked: ', isChecked);
        console.log('child allChecked: ', allChecked);
        
        this.dispatchEvent(new CustomEvent('checkboxchange', {
            detail: { selectedId, isChecked},
            bubbles: true,
            composed: true
        }));
    }

    handleCheckboxAll(event) {
        console.log('table handleCheckboxAll');
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

    //?
    getSelectedRows() {
        const selectedRows = [];
        const checkboxes = this.template.querySelectorAll('lightning-input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            if (checkbox.checked) {
                selectedRows.push(checkbox.dataset.id);
            }
        });
        return selectedRows;
    }

    // 개발 예정. 정렬
    handleSortData(event) {
        const sortBy = event.currentTarget.dataset.sortBy;
        this.dispatchEvent(new CustomEvent('sortdata', { detail: { sortBy } }));
    }
}