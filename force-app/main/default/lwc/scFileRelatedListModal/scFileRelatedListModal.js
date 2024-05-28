import { LightningElement, api } from 'lwc';

export default class ScFileRelatedModal extends LightningElement {
    @api recordId;
    @api fileData;

    acceptedFormats = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.txt,.zip,.rar';

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

}