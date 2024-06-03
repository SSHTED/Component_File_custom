// scFileRelatedListThumbnail.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListThumbnail extends LightningElement {
    @api fileData;
    @api fileCount;
    @api actNo;
    @api selectedRowIds;

    thumbnailThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox' },
        { label: '썸네일', fieldName: 'thumbnail', sortable: false, type: 'thumbnail' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data' }
    ];

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

    connectedCallback() {
        console.log('ScFileRelatedListThumbnail selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
    }

    handleCheckbox(event) {
        console.log('table handleCheckbox');
        
        const selectedId = event.target.dataset.id;
        const isChecked = event.target.checked;
        const rowCheckboxes = this.template.querySelectorAll('.thumbnailTable tbody lightning-input');
        const allChecked = Array.from(rowCheckboxes).every(checkbox => checkbox.checked);
        
        const headerCheckbox = this.template.querySelector('.thumbnailTable thead lightning-input');
  
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

    // 개발 예정. 썸네일 미리보기
    handleThumbnailClick(event) {
        const fileId = event.currentTarget.dataset.id;
        this.dispatchEvent(new CustomEvent('thumbnailclick', { detail: { fileId } }));
    }
}