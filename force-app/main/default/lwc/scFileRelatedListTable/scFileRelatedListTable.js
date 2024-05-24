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

    handleHeaderCheckboxChange(event) {
        const isChecked = event.target.checked;
        const checkboxes = this.template.querySelectorAll('lightning-input[type="checkbox"]');
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
        });
        this.dispatchEvent(new CustomEvent('datatablerowselection', { detail: { isChecked } }));
    }

    handleRowCheckboxChange(event) {
        const selectedRows = this.getSelectedRows();
        this.dispatchEvent(new CustomEvent('datatablerowselection', { detail: { selectedRows } }));
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