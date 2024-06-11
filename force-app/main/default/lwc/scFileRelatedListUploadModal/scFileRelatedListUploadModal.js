import { LightningElement, api } from 'lwc';

export default class ScFileRelatedModal extends LightningElement {
    // property
    @api recordId;
    // data
    @api fileData;

    acceptedFormats = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.txt,.zip,.rar';
    showCategorySelection = true;

    connectedCallback() {
        console.log('modal:', this.fileData)
    }

    handleCloseModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }
    
    handleUploadFinished(event) {
        this.dispatchEvent(new CustomEvent('afteruploadfile', {
            detail: {}, 
            bubbles: true,
            composed: true
        }));

        this.dispatchEvent(new CustomEvent('close'));
    }

    handleCategorySelected() {
        this.showCategorySelection = false;
    }

    get modalTitle(){
        return this.showCategorySelection ? 'Category 선택' : '파일 업로드';
    }
}