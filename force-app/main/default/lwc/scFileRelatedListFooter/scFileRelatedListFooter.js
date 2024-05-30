// scFileRelatedListFooter.js
import { LightningElement } from 'lwc';

export default class ScFileRelatedListFooter extends LightningElement {
    get allRecordsUrl() {
        return this.getUrl('ContentDocument');
    }

    getUrl(objectApiName) {
        let baseUrl = window.location.origin;
        return `${baseUrl}/lightning/o/${objectApiName}/home`;
    }

    handleViewAllClick(event) {
        event.preventDefault();
        window.open(this.allRecordsUrl, '_blank');
    }
}