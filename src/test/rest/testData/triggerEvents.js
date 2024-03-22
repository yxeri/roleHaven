'use strict';
import { dbConfig } from '../../../config/defaults/config';
const data = {};
data.create = {
    first: {
        content: {
            message: {
                text: ['Text'],
                roomId: dbConfig.rooms.public.objectId,
            },
        },
        eventType: dbConfig.TriggerEventTypes.CHATMSG,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
    second: {
        content: {
            docFile: {
                text: ['Text'],
                title: 'title',
                code: 'code',
            },
        },
        eventType: dbConfig.TriggerEventTypes.DOCFILE,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
    missing: {
        content: {
            message: {
                text: ['Text'],
                roomId: dbConfig.rooms.public.objectId,
            },
        },
        eventType: dbConfig.TriggerEventTypes.CHATMSG,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
};
data.update = {
    toUpdate: {
        content: {
            message: {
                text: ['Text'],
                roomId: dbConfig.rooms.public.objectId,
            },
        },
        eventType: dbConfig.TriggerEventTypes.CHATMSG,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
    updateWith: {
        content: {
            message: {
                text: ['New Text'],
                roomId: dbConfig.rooms.public.objectId,
            },
        },
    },
};
data.remove = {
    toRemove: {
        content: {
            message: {
                text: ['Text'],
                roomId: dbConfig.rooms.public.objectId,
            },
        },
        eventType: dbConfig.TriggerEventTypes.CHATMSG,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
    secondToRemove: {
        content: {
            docFile: {
                text: ['Text'],
                title: 'title',
                code: 'code',
            },
        },
        eventType: dbConfig.TriggerEventTypes.DOCFILE,
        changeType: dbConfig.TriggerChangeTypes.CREATE,
    },
};
export default data;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoidHJpZ2dlckV2ZW50cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbInRyaWdnZXJFdmVudHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLGlDQUFpQyxDQUFDO0FBRTNELE1BQU0sSUFBSSxHQUFHLEVBQUUsQ0FBQztBQUVoQixJQUFJLENBQUMsTUFBTSxHQUFHO0lBQ1osS0FBSyxFQUFFO1FBQ0wsT0FBTyxFQUFFO1lBQ1AsT0FBTyxFQUFFO2dCQUNQLElBQUksRUFBRSxDQUFDLE1BQU0sQ0FBQztnQkFDZCxNQUFNLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUTthQUN2QztTQUNGO1FBQ0QsU0FBUyxFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1FBQzdDLFVBQVUsRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQUMsTUFBTTtLQUMvQztJQUNELE1BQU0sRUFBRTtRQUNOLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsS0FBSyxFQUFFLE9BQU87Z0JBQ2QsSUFBSSxFQUFFLE1BQU07YUFDYjtTQUNGO1FBQ0QsU0FBUyxFQUFFLFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxPQUFPO1FBQzdDLFVBQVUsRUFBRSxRQUFRLENBQUMsa0JBQWtCLENBQUMsTUFBTTtLQUMvQztJQUNELE9BQU8sRUFBRTtRQUNQLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7YUFDdkM7U0FDRjtRQUNELFNBQVMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTztRQUM3QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU07S0FDL0M7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7YUFDdkM7U0FDRjtRQUNELFNBQVMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTztRQUM3QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU07S0FDL0M7SUFDRCxVQUFVLEVBQUU7UUFDVixPQUFPLEVBQUU7WUFDUCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLENBQUMsVUFBVSxDQUFDO2dCQUNsQixNQUFNLEVBQUUsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsUUFBUTthQUN2QztTQUNGO0tBQ0Y7Q0FDRixDQUFDO0FBRUYsSUFBSSxDQUFDLE1BQU0sR0FBRztJQUNaLFFBQVEsRUFBRTtRQUNSLE9BQU8sRUFBRTtZQUNQLE9BQU8sRUFBRTtnQkFDUCxJQUFJLEVBQUUsQ0FBQyxNQUFNLENBQUM7Z0JBQ2QsTUFBTSxFQUFFLFFBQVEsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLFFBQVE7YUFDdkM7U0FDRjtRQUNELFNBQVMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTztRQUM3QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU07S0FDL0M7SUFDRCxjQUFjLEVBQUU7UUFDZCxPQUFPLEVBQUU7WUFDUCxPQUFPLEVBQUU7Z0JBQ1AsSUFBSSxFQUFFLENBQUMsTUFBTSxDQUFDO2dCQUNkLEtBQUssRUFBRSxPQUFPO2dCQUNkLElBQUksRUFBRSxNQUFNO2FBQ2I7U0FDRjtRQUNELFNBQVMsRUFBRSxRQUFRLENBQUMsaUJBQWlCLENBQUMsT0FBTztRQUM3QyxVQUFVLEVBQUUsUUFBUSxDQUFDLGtCQUFrQixDQUFDLE1BQU07S0FDL0M7Q0FDRixDQUFDO0FBRUYsZUFBZSxJQUFJLENBQUMifQ==