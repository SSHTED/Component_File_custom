// scFileRelatedListFooter.js
import { LightningElement } from 'lwc';

export default class ScFileRelatedListFooter extends LightningElement {
    handleViewAllClick(event) {
        event.preventDefault();
        this.dispatchEvent(new CustomEvent('viewallclick'));
    }
}