// scFileRelatedListThumbnail.js
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ScFileRelatedListThumbnail extends NavigationMixin(LightningElement) {
    // property
    @api actNo;
    // data
    @api fileData;
    @api selectedRowIds;
    @api resetCheckboxAll() {
        const checkboxes = this.template.querySelectorAll('.checkbox-item');
        checkboxes.forEach(checkbox => {
            checkbox.checked = false;
        });

        this.dispatchEvent(new CustomEvent('clearrowids', {
            bubbles: true,
            composed: true
        }));
    }
    selectedFileId;



    thumbnailThead = [
        { label: 'No', fieldName: 'index', sortable: false, type: 'index', customClass: 'th1' },
        { label: '', fieldName: 'checkbox', sortable: false, type: 'checkbox', customClass: 'th2' },
        { label: '썸네일', fieldName: 'thumbnail', sortable: false, type: 'thumbnail', customClass: 'th3' },
        { label: '파일명', fieldName: 'Title', sortable: true, type: 'data', customClass: 'th4' },
        { label: '확장자', fieldName: 'FileExtension', sortable: true, type: 'data', customClass: 'th5' },
        { label: '크기', fieldName: 'ContentSize', sortable: true, type: 'data', customClass: 'th6' }
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
            detail: { selectedId, isChecked },
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

    handleThumbnailClick(event) {
        console.log('table handleThumbnailClick');
        this.selectedFileId = event.target.dataset.id;
        console.log('table handleThumbnailClick this.selectedFileId >>, ', this.selectedFileId);

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === this.selectedFileId);
        console.log('table handleThumbnailClick selectedFile >>, ', JSON.stringify(selectedFile));

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
}