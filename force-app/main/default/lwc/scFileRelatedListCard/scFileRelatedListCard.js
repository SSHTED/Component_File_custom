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
        this.calculateImageSize();
    }
    
    calculateImageSize() {
        const fileDataPromises = this.fileData.map(file => {
    
            return new Promise((resolve) => {
                let imgElement = new Image();
                imgElement.src = file.ImgSrc;
                imgElement.onload = () => {
    
                    let aspectRatio = imgElement.width / imgElement.height;
                    let height = 230 / aspectRatio;
                    const cleanedFile = {
                        ...file,
                        imgCardClass: height > 400 ? 'imgMain card_x_large' :
                                    height > 300 ? 'imgMain card_large' :
                                    height > 240 ? 'imgMain card_medium' :
                                    height > 180 ? 'imgMain card_small' :
                                                    'imgMain card_x_small'
                    };
    
                    if(this.imgCardShowInfo) {
                        cleanedFile.imgCardClass += '_has_Info';
                    }

                    console.log('정제된 파일 imgCardClass:', JSON.stringify(cleanedFile.imgCardClass, null, 2));
                    resolve(cleanedFile);
                };
            });
        });
    
        Promise.all(fileDataPromises)
            .then(cleanedFileData => {
                this.fileData = cleanedFileData;
            })
            .catch(error => {
                console.error('이미지 로드 중 오류 발생:', error.message);
            });
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

        console.log('📌📌 뭐 눌렸냐? >>> ', actionValue);

        const cardElement = event.currentTarget.closest('[data-id]');
        const fileId = cardElement.dataset.id;

        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: { id: fileId, action: actionValue } }));
    }
}