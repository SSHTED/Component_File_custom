import { LightningElement, api } from 'lwc';
import updateContentDocumentCategories from '@salesforce/apex/SC_FileRelatedListController.updateContentDocumentCategories';

/**
 * @file scFileRelatedListUploadModal.js
 * @description 파일 관련 모달 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @JS 담당자: 신승현
 * @css CSS 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class scFileRelatedListUploadModal extends LightningElement {
    @api recordId;
    @api category;

    @api fileData;
    
    acceptedFormats = '.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.png,.jpg,.jpeg,.gif,.bmp,.txt,.zip,.rar';

    connectedCallback() {

    }

    handleUploadFinished(event) {
        const uploadedFiles = event.detail.files;
        const contentDocumentIds = uploadedFiles.map(file => file.documentId); // 파일의 documentId 리스트
        console.log('uploadedFiles: ', JSON.stringify(uploadedFiles, null, 2));

        this.updateFileCategories(contentDocumentIds);

        this.dispatchEvent(new CustomEvent('afteruploadfile', {
            bubbles: true, // 이벤트 버블링 허용
            composed: true // 컴포넌트 경계를 넘어 이벤트 전파 허용
        }));

        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
     * 파일 카테고리를 업데이트하는 비동기 메소드
     * @param {Array} contentDocumentIds - 업데이트할 파일의 ContentDocumentId 배열
     */
    async updateFileCategories(contentDocumentIds) {
        try {
            // Apex 메소드 호출하여 파일 카테고리 업데이트
            await updateContentDocumentCategories({
                contentDocumentIds: contentDocumentIds,
                category: this.category
            });
        } catch (error) {
            console.error('Error updateFileCategories:', error.message);
        }
    }

    handleCloseModal() {
        this.dispatchEvent(new CustomEvent('close'));
    }

    /**
     * 모달의 제목을 반환하는 getter 메소드
     * @returns {String} 모달 제목
     */
    get modalTitle() {
        return '파일 업로드';
    }
}