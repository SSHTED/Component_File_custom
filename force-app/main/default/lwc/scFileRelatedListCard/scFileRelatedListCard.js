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
    @api imgCardShowOnly;
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
        this.updateElementColors();
    }

    //글자색 변경
    updateElementColors() {
        const titleElements = this.template.querySelectorAll('.imgCardInfoTitle');
        const dateElements = this.template.querySelectorAll('.imgCardInfoDate');
    
        titleElements.forEach(titleElement => {
            titleElement.style.color = this.imgCardInfoTitleColor;
        });
    
        dateElements.forEach(dateElement => {
            dateElement.style.color = this.imgCardInfoDateColor;
        });
    }

    // 그리드 계산 용 메소드
    @api calculateImageSize(fileData) {
        console.log('calculateImageSize');
    
        const fileDataPromises = fileData.map(file => this.processFile(file));
    
        Promise.all(fileDataPromises)
            .then(this.updateFileData.bind(this))
            .catch(this.handleError);
    }
    
    processFile(file) {
        return new Promise((resolve) => {
            if (file.isImage) {
                this.processImageFile(file, resolve);
            } else {
                this.processNonImageFile(file, resolve);
            }
        });
    }
    
    processImageFile(file, resolve) {
        let imgElement = new Image();
        imgElement.src = file.ImgSrc;
        imgElement.onload = () => {
            let aspectRatio = imgElement.width / imgElement.height;
            let height = 230 / aspectRatio;
            let imgCardClass = this.getCardClass(height);
    
            const cleanedFile = this.createCleanedFile(file, imgCardClass);
            console.log('정제된 파일 imgCardClass:', JSON.stringify(cleanedFile.imgCardClass, null, 2));
            resolve(cleanedFile);
        };
        imgElement.onerror = () => {
            console.error('이미지 로드 실패:', file.ImgSrc);
            resolve(this.createCleanedFile(file, 'imgMain card_xx_small'));
        };
    }
    
    processNonImageFile(file, resolve) {
        let imgCardClass = 'imgMain card_Icon';
        resolve(this.createCleanedFile(file, imgCardClass));
    }
    
    createCleanedFile(file, imgCardClass) {
        if (this.imgCardShowInfo) {
            imgCardClass += '_has_Info';
        }
        return { ...file, imgCardClass };
    }
    
    getCardClass(height) {
        const sizeClasses = [
            { threshold: 500, class: 'xxxx_large' },
            { threshold: 450, class: 'xxx_large' },
            { threshold: 400, class: 'xx_large' },
            { threshold: 350, class: 'x_large' },
            { threshold: 300, class: 'large' },
            { threshold: 250, class: 'medium' },
            { threshold: 200, class: 'small' },
            { threshold: 150, class: 'x_small' },
            { threshold: 100, class: 'xx_small' },
            { threshold: 50, class: 'xxx_small' },
        ];
    
        const sizeClass = sizeClasses.find(size => height > size.threshold) || { class: 'xxxx_small' };
        return `imgMain card_${sizeClass.class}`;
    }
    
    updateFileData(cleanedFileData) {
        this.fileData = this.fileData.map(file => {
            const updatedFile = cleanedFileData.find(f => f.Id === file.Id);
            return updatedFile ? updatedFile : file;
        });
    }
    
    handleError(error) {
        console.error('이미지 로드 중 오류 발생:', error.message);
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