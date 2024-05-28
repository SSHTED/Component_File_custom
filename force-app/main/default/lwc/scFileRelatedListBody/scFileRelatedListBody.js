// scFileRelatedListBody.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListBody extends LightningElement {
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail;
    @api viewType_card;
    @api viewType_slide;

    @api selectedRowIds;

    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    @api fileData;
    @api fileCount;
    @api actNo;
    @api defaultViewTypeValue;
    @api isSorted;
    @api sortOrder;
    @api tableColumns;
    @api thumbnailColumns;

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

    initSetting() {
        if (this.defaultViewType && this.viewTypeMap[this.defaultViewType]) {
            this.defaultViewTypeValue = this.viewTypeMap[this.defaultViewType];
            this[this.defaultViewTypeValue] = true;
        }
    }

    handleTabActive(event) {
        console.log('handleTabActive selectedRowIds: ', JSON.stringify(this.selectedRowIds, null, 2));
        this.checkboxReset = true;

        this.dispatchEvent(new CustomEvent('clearrowids'));
      }


    handleSortedByDesc() {
        this.dispatchEvent(new CustomEvent('sortdata', { detail: { isDescending: true } }));
    }

    handleViewTypeChange(event) {
        this.dispatchEvent(new CustomEvent('viewtypechange', { detail: event.target.value }));
    }

    handleSortData(event) {
        this.dispatchEvent(new CustomEvent('sortdata', { detail: event.detail }));
    }

    handleThumbnailClick(event) {
        this.dispatchEvent(new CustomEvent('thumbnailclick', { detail: event.detail }));
    }

    handleImgCardActionClicked(event) {
        this.dispatchEvent(new CustomEvent('imgcardactionclicked', { detail: event.detail }));
    }

    handleImgCardMouseOver(event) {
        this.dispatchEvent(new CustomEvent('imgcardmouseover', { detail: event.detail }));
    }

    handleImgCardMouseOut(event) {
        this.dispatchEvent(new CustomEvent('imgcardmouseout', { detail: event.detail }));
    }
}