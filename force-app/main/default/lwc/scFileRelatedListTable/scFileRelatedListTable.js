// scFileRelatedListTable.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListTable extends LightningElement {
    @api fileData;
    @api fileCount;
    @api actNo;

    tableThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data' }
    ];

    connectedCallback() {
    }

    get extendedTableThead() {
        const result = this.tableThead.map(th => {
            return {
                ...th,
                isIndex: th.type === 'index',
                isCheckbox: th.type === 'checkbox',
                isData: th.type === 'data'
            };
        });

        return result;
    }

    handleAllCheckboxesChange(event) {
        console.log('table handleAllCheckboxesChange');
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
    
    handleCheckboxChange(event) {
        console.log('table handleCheckboxChange');
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        
        this.dispatchEvent(new CustomEvent('checkboxchange', {
            detail: { selectedId, isChecked, allChecked },
            bubbles: true,
            composed: true
        }));
    }

    handleUpdateHeaderCheckbox(event) {
        const { allChecked } = event.detail;
        this.template.querySelector('.dataTable thead lightning-input').checked = allChecked;
    }

    handleCheckboxChange(event) {
        console.log('table. handleCheckboxChange');

        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.dataTable tbody lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
    
        this.dispatchEvent(new CustomEvent('checkboxchange', {
            detail: { selectedId, isChecked, allChecked },
            bubbles: true,
            composed: true
        }));
    }

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

    handleSortData(event) {
        const sortBy = event.currentTarget.dataset.sortBy;
        this.dispatchEvent(new CustomEvent('sortdata', { detail: { sortBy } }));
    }
}