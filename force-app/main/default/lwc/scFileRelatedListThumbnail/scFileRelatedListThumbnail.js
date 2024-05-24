// scFileRelatedListThumbnail.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListThumbnail extends LightningElement {
    @api fileData;
    @api fileCount;
    @api actNo;

    thumbnailThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox' },
        { label: '썸네일', fieldName: 'thumbnail', sortable: false, type: 'thumbnail' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data' }
    ];

    get extendedThumbnailThead(){
        const result = this.thumbnailThead.map(th => {
            return {
                ...th,
                isIndex: th.type === 'index',
                isCheckbox: th.type === 'checkbox',
                isThumbnail: th.type === 'thumbnail',
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

    handleThumbnailClick(event) {
        const fileId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('thumbnailclick', { detail: { fileId } }));
    }
}