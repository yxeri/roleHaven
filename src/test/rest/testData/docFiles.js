'use strict';
const tools = require('../helper/tools');
const { appConfig } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        code: 'first',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
    second: {
        code: 'second',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
    missing: {
        code: 'missing',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
};
data.update = {
    toUpdate: {
        code: 'third',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
    updateWith: {
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
};
data.remove = {
    toRemove: {
        code: 'fifth',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
    secondToRemove: {
        code: 'sixth',
        title: tools.createRandString({ length: appConfig.docFileTitleMaxLength }),
        text: [
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
            tools.createRandString({ length: appConfig.docFileMaxLength / 2 }),
        ],
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZG9jRmlsZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJkb2NGaWxlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQSxZQUFZLENBQUM7QUFFYixNQUFNLEtBQUssR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUN6QyxNQUFNLEVBQUUsU0FBUyxFQUFFLEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFFakUsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsT0FBTztRQUNiLEtBQUssRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDMUUsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxNQUFNLEVBQUU7UUFDTixJQUFJLEVBQUUsUUFBUTtRQUNkLEtBQUssRUFBRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLHFCQUFxQixFQUFFLENBQUM7UUFDMUUsSUFBSSxFQUFFO1lBQ0osS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxnQkFBZ0IsR0FBRyxDQUFDLEVBQUUsQ0FBQztZQUNsRSxLQUFLLENBQUMsZ0JBQWdCLENBQUMsRUFBRSxNQUFNLEVBQUUsU0FBUyxDQUFDLGdCQUFnQixHQUFHLENBQUMsRUFBRSxDQUFDO1NBQ25FO0tBQ0Y7SUFDRCxPQUFPLEVBQUU7UUFDUCxJQUFJ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