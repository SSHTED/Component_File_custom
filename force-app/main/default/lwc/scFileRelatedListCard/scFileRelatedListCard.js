// scFileRelatedListCard.js
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';

export default class ScFileRelatedListCard extends NavigationMixin(LightningElement) {
    // property
    @api recordId;
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
                        imgCardClass: height > 400 ? 'imgMain card_xxx_large' :
                                    height > 350 ? 'imgMain card_xx_large' :
                                    height > 300 ? 'imgMain card_x_large' :
                                    height > 250 ? 'imgMain card_large' :
                                    height > 200 ? 'imgMain card_medium' :
                                    height > 150 ? 'imgMain card_small' :
                                    height > 100 ? 'imgMain card_x_small' :
                                    height > 50 ? 'imgMain card_xx_small' :
                                                    'imgMain card_xxx_small'
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

    renderedCallback(){

        // 글자색 변경
        const titleElements = this.template.querySelectorAll('.imgCardInfoTitle');
        const dateElements = this.template.querySelectorAll('.imgCardInfoDate');

        // 각 요소에 대해 글자색을 변경
        titleElements.forEach(titleElement => {
            titleElement.style.color = this.imgCardInfoTitleColor;
        });

        dateElements.forEach(dateElement => {
            dateElement.style.color = this.imgCardInfoDateColor;
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
        const selectedFileId = event.currentTarget.dataset.id;

        console.log('Action Value:', actionValue);
        console.log('Selected File ID:', selectedFileId);

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === selectedFileId);
        const selectedFileDocId = selectedFile.ContentDocumentId;
        console.error('이미지 selectedFile:', JSON.stringify(selectedFile, null, 2));


        switch (actionValue) {
            case 'expand':
                this[NavigationMixin.Navigate]({
                    type: 'standard__namedPage',
                    attributes: {
                        pageName: 'filePreview'
                    },
                    state: {
                        recordIds: selectedFileDocId
                    }
                });
                break;
            
            case 'download':
                if (confirm('다운로드 하시겠습니까?')) {
                    const selectedFiles = this.fileData.filter(file => selectedFileId.includes(file.Id));
                    this.totalFilesToDownload = selectedFiles.length;
                    this.isShowDownloadModal = true;
                    this.isDownloadCancelled = false;
                    this.isDownloadEnd = false;
                    this.downloadProgress = 0;
                    let index = 0;
        
                    const downloadNextFile = () => {
                        if (index >= selectedFiles.length || this.isDownloadCancelled) {
                            this.downloadProgress = this.totalFilesToDownload;
                            this.isDownloadEnd = true;
                            return;
                        }
        
                        const file = selectedFiles[index];
                        const downloadLink = document.createElement('a');
                        downloadLink.href = file.VersionDataUrl;
                        downloadLink.download = file.Title;
                        document.body.appendChild(downloadLink);
                        downloadLink.click();
                        document.body.removeChild(downloadLink);
        
                        index++;
                        this.downloadProgress = index;
                        setTimeout(downloadNextFile, 500);
                    };
                    downloadNextFile();
                }
                break;
            
            case 'delete':
                if (confirm('선택한 항목을 삭제하시겠습니까?')) {
                    deleteFilesByRecordId({ recordId: this.recordId, deleteIdList: selectedFileId })
                        .then(result => {
                            console.log('삭제 결과:', result);
                            if (result.Result) {
                                console.log('삭제된 항목 수:', result.Count);
                                this.fileData = this.fileData.filter(item => !selectedFileId.includes(item.Id));
                                console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2));
                                this.selectedRowIds = [];
                                this.dispatchEvent(new CustomEvent('afterdeletefile', {
                                    detail: this.fileData,
                                    bubbles: true, // 이벤트 버블링 허용
                                    composed: true // 컴포넌트 경계를 넘어 이벤트 전파 허용
                                }));
                                
                            } else {
                                console.error('삭제 실패');
                                alert('항목 삭제에 실패했습니다.');
                            }
                        })
                        .catch(error => {
                            console.error('삭제 요청 실패:', error.message);
                            alert('항목 삭제 요청에 실패했습니다.');
                        });
                }
                break;
            default:
        }

        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: { id: fileId, action: actionValue } }));
    }
}