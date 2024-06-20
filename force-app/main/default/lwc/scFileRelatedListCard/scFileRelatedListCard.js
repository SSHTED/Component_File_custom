// scFileRelatedListCard.js
import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';
import deleteFilesByRecordId from '@salesforce/apex/SC_FileRelatedListController.deleteFilesByRecordId';

/**
 * @file ScFileRelatedListCard.js
 * @description 파일 다운로드 이미지 카드 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListCard extends NavigationMixin(LightningElement) {
    // property
    @api recordId;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    // data
    @api fileData;
    @api selectedRowIds;

    innerCardClass = '';

    connectedCallback() {
        this.initSet();
        this.calculateImageSize(this.fileData);
    }

    initSet() {
        this.innerCardClass = this.imgCardShowInfo ? 'imgWrapper_has_Info' : 'imgWrapper';
    }

    renderedCallback() {

    }

    // 그리드 계산 용 메소드
    @api calculateImageSize(fileData) {
        console.log('calculateImageSize');
        const fileDataPromises = fileData.map(file => {
            return new Promise((resolve) => {
                let imgElement = new Image();
                imgElement.src = file.ImgSrc;
                imgElement.onload = () => {
                    let aspectRatio = imgElement.width / imgElement.height;
                    let height = 230 / aspectRatio;
                    const cleanedFile = {
                        ...file,
                        imgCardClass: height > 500 ? 'imgMain card_x_large' :
                            height > 400 ? 'imgMain card_large' :
                                height > 300 ? 'imgMain card_medium' :
                                    height > 200 ? 'imgMain card_small' :
                                        height > 100 ? 'imgMain card_x_small' :
                                            'imgMain card_xx_small'
                    };

                    if (this.imgCardShowInfo) {
                        cleanedFile.imgCardClass += '_has_Info';
                    }

                    console.log('정제된 파일 imgCardClass:', JSON.stringify(cleanedFile.imgCardClass, null, 2));
                    resolve(cleanedFile);
                };
                imgElement.onerror = () => {
                    console.error('이미지 로드 실패:', file.ImgSrc);
                    resolve({
                        ...file,
                        imgCardClass: 'imgMain card_xx_small'  // 기본 클래스 할당
                    });
                };
            });
        });

        Promise.all(fileDataPromises)
            .then(cleanedFileData => {
                // 새로운 데이터에 대한 이미지 크기 계산 후 this.fileData에 반영
                this.fileData = this.fileData.map(file => {
                    const updatedFile = cleanedFileData.find(f => f.Id === file.Id);
                    return updatedFile ? updatedFile : file;
                });
            })
            .catch(error => {
                console.error('이미지 로드 중 오류 발생:', error.message);
            });
    }


    renderedCallback() {
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

        // 선택된 파일 객체 찾기
        const selectedFile = this.fileData.find(file => file.Id === selectedFileId);
        const selectedFileDocId = selectedFile.ContentDocumentId;

        switch (actionValue) {
            case 'expand':
                this.handleExpand(selectedFileDocId);
                break;

            case 'download':
                this.handleDownload(selectedFileId);
                break;

            case 'delete':
                this.handleDelete(selectedFileId);
                break;

            default:
        }
    }

    // 파일 확장
    handleExpand(selectedFileDocId) {
        this[NavigationMixin.Navigate]({
            type: 'standard__namedPage',
            attributes: {
                pageName: 'filePreview'
            },
            state: {
                recordIds: selectedFileDocId
            }
        });
    }

    // 파일 다운로드
    handleDownload(selectedFileId) {
        if (!confirm('다운로드 하시겠습니까?')) {
            return;
        }

        const selectedFiles = this.fileData.filter(file => selectedFileId.includes(file.Id));
        this.initializeDownload(selectedFiles.length);
        this.downloadFiles(selectedFiles);
    }

    initializeDownload(totalFiles) {
        this.totalFilesToDownload = totalFiles;
        this.isShowDownloadModal = true;
        this.isDownloadCancelled = false;
        this.isDownloadEnd = false;
        this.downloadProgress = 0;
    }

    downloadFiles(selectedFiles) {
        let index = 0;
        const downloadNextFile = () => {
            if (index >= selectedFiles.length || this.isDownloadCancelled) {
                this.finalizeDownload();
                return;
            }

            const file = selectedFiles[index];
            this.downloadFile(file);

            index++;
            this.downloadProgress = index;
            setTimeout(downloadNextFile, 500);
        };
        downloadNextFile();
    }

    downloadFile(file) {
        const downloadLink = document.createElement('a');
        downloadLink.href = file.VersionDataUrl;
        downloadLink.download = file.Title;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }

    finalizeDownload() {
        this.downloadProgress = this.totalFilesToDownload;
        this.isDownloadEnd = true;
    }

    // 파일 삭제
    handleDelete(selectedFileId) {
        if (!confirm('선택한 항목을 삭제하시겠습니까?')) {
            return;
        }

        deleteFilesByRecordId({ recordId: this.recordId, deleteIdList: selectedFileId })
            .then(result => this.handleDeleteSuccess(result, selectedFileId))
            .catch(error => this.handleDeleteError(error));
    }

    handleDeleteSuccess(result, selectedFileId) {
        console.log('삭제 결과:', result);
        if (result.Result) {
            console.log('삭제된 항목 수:', result.Count);
            this.fileData = this.fileData.filter(item => !selectedFileId.includes(item.Id));
            console.log('삭제후 file Data: ', JSON.stringify(this.fileData, null, 2));
            this.selectedRowIds = [];
            this.dispatchEvent(new CustomEvent('afterdeletefile', {
                detail: this.fileData,
                bubbles: true,
                composed: true
            }));
        } else {
            console.error('삭제 실패');
            alert('항목 삭제에 실패했습니다.');
        }
    }

    handleDeleteError(error) {
        console.error('삭제 요청 실패:', error.message);
        alert('항목 삭제 요청에 실패했습니다.');
    }
}