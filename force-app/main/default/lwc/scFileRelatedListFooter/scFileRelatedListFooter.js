// scFileRelatedListFooter.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListFooter extends LightningElement {
    @api recordId;
    @api objectApiName;

    get allRecordsUrl() {
        return this.getUrl(this.objectApiName, this.recordId);
    }

    getUrl(objectApiName, recordId) {
        let baseUrl = window.location.origin;
        // return `${baseUrl}/lightning/o/${objectApiName}/home`;
        return `${baseUrl}/lightning/r/${objectApiName}/${recordId}/related/CombinedAttachments/view`;

    }

    handleViewAllClick(event) {
        event.preventDefault();
        window.open(this.allRecordsUrl, '_blank');
    }
}