// scFileRelatedListBody.js
import { LightningElement, api } from 'lwc';

/**
 * @file ScFileRelatedListBody.js
 * @description 파일 다운로드 테이블, 썸네일, 이미지, 슬라이드 탭의 부모 컴포넌트 (차상위)
 * @version 1.0.0
 * @date 2024-06-12
 * @js 담당자: 신승현
 * @css 담당자: 최복규
 * 
 * @updates
 *  - @updatedBy {이름} @updateVersion {수정 버전} @updateDate {수정 날짜}
 */
export default class ScFileRelatedListBody extends LightningElement {
    //property
    @api recordId;
    @api actNo;
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail;
    @api viewType_card;
    @api viewType_slide;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    @api slideDelayTime;
    @api tableComponentHeight;
    @api thumbnailComponentHeight;

    //data
    @api fileData;
    @api selectedRowIds;
    @api isComponentSizeSmall;

    //자식 컴포넌트
    @api scFileRelatedListTable;
    @api scFileRelatedListThumbnail;
    @api scFileRelatedListCard;
    @api scFileRelatedListSlide;

    defaultViewTypeValue;
    checkboxReset = false;
    
    viewTypeMap = {
        '테이블': 'viewType_table',
        '썸네일': 'viewType_thumbnail',
        '이미지 카드': 'viewType_card',
        '슬라이드': 'viewType_slide'
    };

    get viewTypeTabs() {
        const tabs = Object.entries(this.viewTypeMap)
            .filter(([label, viewType]) => this[viewType])
            .map(([label, viewType]) => ({
                value: viewType,
                label,
                [`is${viewType.split('_')[1].charAt(0).toUpperCase() + viewType.split('_')[1].slice(1)}`]: true,
            }));

        return tabs;
    }

    connectedCallback() {
        this.initSetting();
    }

    renderedCallback() {
        this.scFileRelatedListTable = this.template.querySelector('c-sc-file-related-list-table');
        this.scFileRelatedListThumbnail = this.template.querySelector('c-sc-file-related-list-thumbnail');
        this.scFileRelatedListCard = this.template.querySelector('c-sc-file-related-list-card');
        this.scFileRelatedListSlide = this.template.querySelector('c-sc-file-related-list-slide');
    }

    initSetting() {
        if (this.defaultViewType && this.viewTypeMap[this.defaultViewType]) {
            if (this.viewTypeMap.hasOwnProperty(this.defaultViewType)) {
                this.defaultViewTypeValue = this.viewTypeMap[this.defaultViewType];
                this[this.defaultViewTypeValue] = true;
            }
        }
    }

    handleTabActive(event) {
        const activeTabValue = event.target.value;
        console.log('handleTabActive: ', activeTabValue);

        switch (activeTabValue) {
            case this.viewTypeMap['테이블']:
                this.handleTableTabActivated();
                break;
            case this.viewTypeMap['썸네일']:
                this.handleThumbnailTabActivated();
                break;
            case this.viewTypeMap['이미지 카드']:
                this.handleImageCardTabActivated();
                break;
            case this.viewTypeMap['슬라이드']:
                this.handleSlideTabActivated();
                break;
            default:
                console.error('handleTabActive. 탭 활성화 에러');
                break;
        }

        if (activeTabValue !== this.viewTypeMap['슬라이드']) {
            this.handleSlideTabDeactivated();
        }

        this.resetCheckboxInComp();
        this.dispatchEvent(new CustomEvent('tabactive', { detail: activeTabValue }));
    }

    handleTableTabActivated(){
        console.log('테이블 형태의 탭.');
    }

    handleThumbnailTabActivated(){
        console.log('썸네일 형태의 탭.');
    }

    handleImageCardTabActivated(){
        console.log('이미지 형태의 탭.');

    }

    handleSlideTabActivated() {
        console.log('슬라이드 형태의 탭.');

        setTimeout(() => {
            const slideComponent = this.template.querySelector('c-sc-file-related-list-slide');
            console.log('슬라이드 slideComponent', slideComponent);
    
            if (slideComponent) {
                // slideComponent.nextImage();
                slideComponent.showFirstImage();
                slideComponent.handleSlidePlay();
            }
        }, 0);
    }

    handleSlideTabDeactivated() {
        const slideComponent = this.template.querySelector('c-sc-file-related-list-slide');
        console.log('슬라이드 slideComponent', slideComponent);
    
        if (slideComponent) {
            slideComponent.handleSlidePlayStop();
        }
    }

    @api
    resetCheckboxInComp() {
        const relatedListComponents = [
            ...this.template.querySelectorAll('c-sc-file-related-list-table'),
            ...this.template.querySelectorAll('c-sc-file-related-list-thumbnail')
        ];

        relatedListComponents.forEach(component => {
            if (component.resetCheckboxAll) {
                component.resetCheckboxAll();
            }
        });
    }
}