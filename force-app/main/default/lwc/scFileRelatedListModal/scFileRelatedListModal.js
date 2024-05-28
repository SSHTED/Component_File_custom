import { LightningElement, api } from 'lwc';

export default class ScFileRelatedModal extends LightningElement {
    @api recordId;

    connectedCallback(){
    }

    handleCloseModal(){
        this.dispatchEvent(new CustomEvent('close'));
    }

    handleUploadFiles(){

    }

    handleUploadFinished(){

    }

}