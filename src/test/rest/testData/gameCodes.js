'use strict';
const tools = require('../helper/tools');
const { appConfig, dbConfig, } = require('../../../config/defaults/config');
const data = {};
data.create = {
    first: {
        code: tools.createRandString({ length: appConfig.gameCodeLength }),
    },
    second: {
        codeType: dbConfig.GameCodeTypes.TEXT,
        codeContent: ['Two lines', 'of text'],
    },
};
data.update = {
    toUpdate: {
        codeType: dbConfig.GameCodeTypes.TEXT,
        codeContent: ['Two lines', 'of text'],
    },
    updateWith: {
        codeContent: ['Three lines', 'of text', 'in it'],
    },
};
data.remove = {
    toRemove: {
        codeType: dbConfig.GameCodeTypes.TEXT,
        codeContent: ['Two lines', 'of text'],
    },
    secondToRemove: {
        codeType: dbConfig.GameCodeTypes.TEXT,
        codeContent: ['Two lines', 'of text'],
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZ2FtZUNvZGVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiZ2FtZUNvZGVzLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLFlBQVksQ0FBQztBQUViLE1BQU0sS0FBSyxHQUFHLE9BQU8sQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO0FBQ3pDLE1BQU0sRUFDSixTQUFTLEVBQ1QsUUFBUSxHQUNULEdBQUcsT0FBTyxDQUFDLGlDQUFpQyxDQUFDLENBQUM7QUFXL0MsTUFBTSxJQUFJLEdBQUcsRUFBRSxDQUFDO0FBRWhCLElBQUksQ0FBQyxNQUFNLEdBQUc7SUFDWixLQUFLLEVBQUU7UUFDTCxJQUFJLEVBQUUsS0FBSyxDQUFDLGdCQUFnQixDQUFDLEVBQUUsTUFBTSxFQUFFLFNBQVMsQ0FBQyxjQUFjLEVBQUUsQ0FBQztLQUNuRTtJQUNELE1BQU0sRUFBRTtRQUNOLFFBQVEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUk7UUFDckMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztLQUN0QztDQUNGLENBQUM7QUFFRixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osUUFBUSxFQUFFO1FBQ1IsUUFBUSxFQUFFLFFBQVEsQ0FBQyxhQUFhLENBQUMsSUFBSTtRQUNyQyxXQUFXLEVBQUUsQ0FBQyxXQUFXLEVBQUUsU0FBUyxDQUFDO0tBQ3RDO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsV0FBVyxFQUFFLENBQUMsYUFBYSxFQUFFLFNBQVMsRUFBRSxPQUFPLENBQUM7S0FDakQ7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLFFBQVEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUk7UUFDckMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztLQUN0QztJQUNELGNBQWMsRUFBRTtRQUNkLFFBQVEsRUFBRSxRQUFRLENBQUMsYUFBYSxDQUFDLElBQUk7UUFDckMsV0FBVyxFQUFFLENBQUMsV0FBVyxFQUFFLFNBQVMsQ0FBQztLQUN0QztDQUNGLENBQUM7QUFFRixlQUFlLElBQUksQ0FBQyJ9