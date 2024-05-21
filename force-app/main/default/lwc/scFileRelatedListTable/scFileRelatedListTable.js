// scFileRelatedListTable.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListTable extends LightningElement {
    @api fileData;
    @api fileCount;
    @api actNo;

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