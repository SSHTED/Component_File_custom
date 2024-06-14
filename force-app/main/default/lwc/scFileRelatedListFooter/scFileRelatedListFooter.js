import { LightningElement, api } from 'lwc';
import { NavigationMixin } from 'lightning/navigation';

/**
 * @file scFileRelatedListFooter.js
 * @description 파일 관련 목록 푸터 컴포넌트
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
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