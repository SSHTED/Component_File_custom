// scFileRelatedListBody.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListBody extends LightningElement {
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail; 
    @api viewType_card;
    @api viewType_slide;

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

    viewTypeMap = {
        '테이블': 'viewType_table',
        '썸네일': 'viewType_thumbnail',
        '이미지 카드': 'viewType_card',
        '슬라이드': 'viewType_slide'
    };

    get viewTypeTabs() {
        const viewTypeLabels = {
            table: '테이블',
            thumbnail: '썸네일',
            card: '이미지 카드',
            slide: '슬라이드'
        };

        return ['table', 'thumbnail', 'card', 'slide'].filter(viewType => this[`viewType_${viewType}`]).map(viewType => ({
            value: `viewType_${viewType}`,
            label: viewTypeLabels[viewType],
            [`is${viewType.charAt(0).toUpperCase() + viewType.slice(1)}`]: true,
        }));
    }

    connectedCallback() {
        this.initSetting();
    }

    initSetting() {
        this.defaultViewTypeValue = this.viewTypeMap[this.defaultViewType];

        this[this.viewTypeMap[this.defaultViewType]] = true; //this.viewType_000 = true;

    }

    handleSortedByDesc() {
        this.dispatchEvent(new CustomEvent('sortdata', { detail: { isDescending: true } }));
    }

    handleViewTypeChange(event) {
        this.dispatchEvent(new CustomEvent('viewtypechange', { detail: event.target.value }));
    }

    handleCheckboxClick(event) {
        this.dispatchEvent(new CustomEvent('datatablerowselection', { detail: event.detail }));
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