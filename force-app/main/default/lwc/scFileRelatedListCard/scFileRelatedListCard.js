// scFileRelatedListCard.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListCard extends LightningElement {
    // property
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    // data
    @api fileData;
    @api selectedRowIds;

    connectedCallback() {
        // console.log('📌📌 이거 나오나??? ', JSON.stringify(this.fileData, null, 2));
    }

    renderedCallback() {
        // console.log('📌📌 이거 나오나??? ', JSON.stringify(this.fileData, null, 2));
    }

    handleMouseOver(event) {
        const cardElement = event.currentTarget;
        const btnArea = cardElement.querySelector('.btn_area');
        const shadowBox = cardElement.querySelector('.shadowBox');
        btnArea.style.display = 'block';
        shadowBox.style.display = 'block';

        this.dispatchEvent(new CustomEvent('imgcardmouseover', { detail: { id: cardElement.dataset.id } }));
    }

    handleMouseOut(event) {
        const cardElement = event.currentTarget;
        const btnArea = cardElement.querySelector('.btn_area');
        const shadowBox = cardElement.querySelector('.shadowBox');
        btnArea.style.display = 'none';
        shadowBox.style.display = 'none';

        this.dispatchEvent(new CustomEvent('imgcardmouseout', { detail: { id: cardElement.dataset.id } }));
    }

    handleActionClicked(event) {
        const actionValue = event.currentTarget.dataset.value;
        const cardElement = event.currentTarget.closest('[data-id]');
        const fileId = cardElement.dataset.id;

        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: { id: fileId, action: actionValue } }));
    }
}