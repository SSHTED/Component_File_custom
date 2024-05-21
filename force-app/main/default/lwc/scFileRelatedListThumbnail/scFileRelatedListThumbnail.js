// scFileRelatedListThumbnail.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListThumbnail extends LightningElement {
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

    handleThumbnailClick(event) {
        const fileId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('thumbnailclick', { detail: { fileId } }));
    }
}