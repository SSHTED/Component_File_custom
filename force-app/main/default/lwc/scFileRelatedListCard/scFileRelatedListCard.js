// scFileRelatedListCard.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListCard extends LightningElement {
    @api fileData;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    @api selectedRowIds;

    connectedCallback() {
        console.log('ScFileRelatedListCard fileData: ', JSON.stringify(this.fileData, null, 2));
    }

    handleMouseOver(event) {
        const cardElement = event.currentTarget;
        const btnArea = cardElement.querySelector('.btn_area');
        btnArea.style.display = 'block';

        this.dispatchEvent(new CustomEvent('imgcardmouseover', { detail: { id: cardElement.dataset.id } }));
    }

    handleMouseOut(event) {
        const cardElement = event.currentTarget;
        const btnArea = cardElement.querySelector('.btn_area');
        btnArea.style.display = 'none';

        this.dispatchEvent(new CustomEvent('imgcardmouseout', { detail: { id: cardElement.dataset.id } }));
    }

    handleActionClicked(event) {
        const actionValue = event.currentTarget.dataset.value;
        const cardElement = event.currentTarget.closest('[data-id]');
        const fileId = cardElement.dataset.id;

        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: { id: fileId, action: actionValue } }));
    }
}