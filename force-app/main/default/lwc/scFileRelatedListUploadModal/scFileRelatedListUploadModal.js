import { LightningElement, api } from 'lwc';
import saveFileWithCategory from '@salesforce/apex/SC_FileRelatedListController.saveFileWithCategory';
import updateContentDocumentCategory from '@salesforce/apex/SC_FileRelatedListController.updateContentDocumentCategory';

export default class ScFileRelatedModal extends LightningElement {
    // property
    @api recordId;
    // data
    @api fileData;

    acceptedFormats = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.txt,.zip,.rar';
    showCategorySelection = true;
    selectedCategory = '';

    connectedCallback() {
        console.log('modal:', this.fileData)
    }

    handleCloseModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    // handleUploadFinished(event) {
    //     const uploadedFiles = event.detail.files;
    //     console.log('업로드 파일: ', uploadedFiles)

    //     const updatedFiles = uploadedFiles.map(file => ({
    //         ...file,
    //         Category__c: this.selectedCategory
    //     }));
    //     console.log('업로드 파일 + 카테고리 : ', JSON.stringify(updatedFiles,null,2));

    //     this.dispatchEvent(new CustomEvent('afteruploadfile', {
    //         detail: { files: updatedFiles },
    //         bubbles: true,
    //         composed: true
    //     }));

    //     this.dispatchEvent(new CustomEvent('close'));
    // }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const uniqueFileIds = new Set();
        console.log('uploadedFiles: ', uploadedFiles);

        uploadedFiles.forEach(file => {
            console.log('file: ', JSON.stringify(file, null, 2));

            if (!uniqueFileIds.has(file.documentId)) {
                uniqueFileIds.add(file.documentId);
                
                // 파일 처리 로직 수행
                // this.saveFile(file);
                this.updateFileCategory(file);

            }
        });

        // 업로드 완료 후 수행할 작업
        this.dispatchEvent(new CustomEvent('afteruploadfile', {
            // detail: { files: uniqueFileIds },
            bubbles: true,
            composed: true
        }));

        this.dispatchEvent(new CustomEvent('close'));
    }

    async updateFileCategory(file) {
        console.log('업데이트 파일 카테고리: ', file);
        try {
            await updateContentDocumentCategory({
                contentDocumentId: file.documentId,
                category: this.selectedCategory
            });
        } catch (error) {
            console.error('Error updating file category:', error);
        }
    }

    // async saveFile(file) {
    //     console.log('세이브 파일: '. file)
    //     try {
    //         await saveFileWithCategory({
    //             recordId: this.recordId,
    //             fileName: file.name,
    //             base64Data: file.contentVersionId,
    //             category: this.selectedCategory
    //         });
    //     } catch (error) {
    //         console.error('Error saving file with category:', error);
    //     }
    // }


    handleCategorySelected() {
        this.showCategorySelection = false;
    }

    handleCategoryChange(event) {
        this.selectedCategory = event.target.value;
    }

    get modalTitle() {
        return this.showCategorySelection ? 'Category 선택' : '파일 업로드';
    }
}