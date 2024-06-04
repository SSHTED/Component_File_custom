// scFileRelatedListBody.js
import { LightningElement, api } from 'lwc';

export default class ScFileRelatedListBody extends LightningElement {
    //property
    @api actNo;
    @api defaultViewType;
    @api viewType_table;
    @api viewType_thumbnail;
    @api viewType_card;
    @api viewType_slide;
    @api imgCardShowInfo;
    @api imgCardInfoTitleColor;
    @api imgCardInfoDateColor;
    //data
    @api fileData;
    @api selectedRowIds;
    @api isComponentSizeSmall;

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
    }

    initSetting() {
        if (this.defaultViewType && this.viewTypeMap[this.defaultViewType]) {
            if (this.viewTypeMap.hasOwnProperty(this.defaultViewType)) {
                this.defaultViewTypeValue = this.viewTypeMap[this.defaultViewType];
                this[this.defaultViewTypeValue] = true;
            }
        }
    }

    handleTabActive() {
        console.log('handleTabActive');
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