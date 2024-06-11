// scFileRelatedListFooter.js
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

export default class ScFileRelatedListFooter extends NavigationMixin(LightningElement) {
    @api recordId;
    @api objectApiName;

    get fileRelatedListUrl() {
        return this.getUrl(this.objectApiName, this.recordId);
    }

    getUrl(objectApiName, recordId) {
        let baseUrl = window.location.origin;
        return `${baseUrl}/lightning/r/${objectApiName}/${recordId}/related/CombinedAttachments/view`;
    }

    handleViewAllClick(event) {
        event.preventDefault();
        this[NavigationMixin.Navigate]({
            type: 'standard__recordRelationshipPage',
            attributes: {
                recordId: this.recordId,
                objectApiName: this.objectApiName,
                relationshipApiName: 'CombinedAttachments',
                actionName: 'view'
            }
        });
    }
}