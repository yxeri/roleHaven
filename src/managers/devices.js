'use strict';
import { dbConfig } from '../config/defaults/config';
import errorCreator from '../error/errorCreator';
import authenticator from '../helpers/authenticator';
import managerHelper from '../helpers/manager';
function getDeviceById({ token, callback, deviceId, internalCallUser, }) {
    authenticator.isUserAllowed({
        token,
        internalCallUser,
        commandName: dbConfig.apiCommands.GetDevices.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getDeviceById({
                deviceId,
                callback: ({ error: getDeviceError, data: getDeviceData, }) => {
                    if (getDeviceError) {
                        callback({ error: getDeviceError });
                        return;
                    }
                    const { device } = getDeviceData;
                    const { canSee, hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: device,
                        toAuth: user,
                    });
                    if (!canSee) {
                        callback({ error: errorCreator.NotAllowed({ name: `device ${deviceId}` }) });
                        return;
                    }
                    if (!hasFullAccess) {
                        callback({ data: { device: managerHelper.stripObject({ object: device }) } });
                        return;
                    }
                    callback({ data: { device } });
                },
            });
        },
    });
}
function createDevice({ token, device, callback, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.CreateDevice.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            const deviceToCreate = device;
            deviceToCreate.ownerId = user.objectId;
            createDevice({
                device,
                callback: (deviceData) => {
                    if (deviceData.error) {
                        callback({ error: deviceData.error });
                        return;
                    }
                    const createdDevice = deviceData.data.device;
                    const creatorDataToSend = {
                        data: {
                            isSender: true,
                            device: createdDevice,
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    const dataToSend = {
                        data: {
                            device: managerHelper.stripObject({ object: createdDevice }),
                            changeType: dbConfig.ChangeTypes.CREATE,
                        },
                    };
                    if (socket) {
                        socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                    }
                    else {
                        io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                        io.to(createdDevice.objectId)
                            .emit(dbConfig.EmitTypes.DEVICE, creatorDataToSend);
                    }
                    callback(creatorDataToSend);
                },
            });
        },
    });
}
function updateDevice({ token, device, deviceId, options, callback, io, socket, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateDevice.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user: authUser } = data;
            getDeviceById({
                deviceId,
                internalCallUser: authUser,
                callback: ({ error: deviceError, data: deviceData, }) => {
                    if (deviceError) {
                        callback({ error: deviceError });
                        return;
                    }
                    const { device: foundDevice } = deviceData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: foundDevice,
                        toAuth: authUser,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `device ${deviceId}` }) });
                        return;
                    }
                    updateDevice({
                        options,
                        device,
                        deviceId,
                        callback: ({ error: updateError, data: updateData, }) => {
                            if (updateError) {
                                callback({ error: updateError });
                                return;
                            }
                            const { device: updatedDevice } = updateData;
                            const creatorData = {
                                data: {
                                    isSender: true,
                                    device: updatedDevice,
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            const dataToSend = {
                                data: {
                                    device: managerHelper.stripObject({ object: updatedDevice }),
                                    changeType: dbConfig.ChangeTypes.UPDATE,
                                },
                            };
                            if (socket) {
                                socket.broadcast.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                            }
                            else {
                                io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                                io.to(updatedDevice.objectId)
                                    .emit(dbConfig.EmitTypes.DEVICE, creatorData);
                            }
                            callback(creatorData);
                        },
                    });
                },
            });
        },
    });
}
function getDevicesByUser({ token, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.GetDevices.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getDevicesByUser({
                user,
                callback: ({ error: getDevicesError, data: getDevicesData, }) => {
                    if (getDevicesError) {
                        callback({ error: getDevicesError });
                        return;
                    }
                    const { devices } = getDevicesData;
                    const allDevices = devices.map((deviceItem) => {
                        const { hasFullAccess, } = authenticator.hasAccessTo({
                            toAuth: user,
                            objectToAccess: deviceItem,
                        });
                        if (!hasFullAccess) {
                            return managerHelper.stripObject({ object: deviceItem });
                        }
                        return deviceItem;
                    });
                    callback({ data: { devices: allDevices } });
                },
            });
        },
    });
}
function removeDevice({ token, deviceId, callback, io, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.RemoveDevice.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getDeviceById({
                deviceId,
                internalCallUser: user,
                callback: ({ error: deviceError, data: deviceData, }) => {
                    if (deviceError) {
                        callback({ error: deviceError });
                        return;
                    }
                    const { device } = deviceData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: device,
                        toAuth: user,
                    });
                    if (!hasFullAccess) {
                        callback({ error: new errorCreator.NotAllowed({ name: `device ${deviceId}` }) });
                        return;
                    }
                    removeDevice({
                        deviceId,
                        callback: ({ error: removeDeviceError }) => {
                            if (removeDeviceError) {
                                callback({ error: removeDeviceError });
                                return;
                            }
                            const dataToSend = {
                                data: {
                                    device: { objectId: deviceId },
                                    changeType: dbConfig.ChangeTypes.REMOVE,
                                },
                            };
                            io.emit(dbConfig.EmitTypes.DEVICE, dataToSend);
                            callback(dataToSend);
                        },
                    });
                },
            });
        },
    });
}
function updateAccess({ token, deviceId, teamAdminIds, userAdminIds, userIds, teamIds, bannedIds, shouldRemove, callback, }) {
    authenticator.isUserAllowed({
        token,
        commandName: dbConfig.apiCommands.UpdateDevice.name,
        callback: ({ error, data, }) => {
            if (error) {
                callback({ error });
                return;
            }
            const { user } = data;
            getDeviceById({
                deviceId,
                internalCallUser: user,
                callback: ({ error: deviceError, data: deviceData, }) => {
                    if (deviceError) {
                        callback({ error: deviceError });
                        return;
                    }
                    const { device } = deviceData;
                    const { hasFullAccess, } = authenticator.hasAccessTo({
                        objectToAccess: device,
                        toAuth: user,
                    });
                    if (!hasFullAccess) {
                        callback({ error: errorCreator.NotAllowed({ name: `device ${deviceId}` }) });
                        return;
                    }
                    updateAccess({
                        shouldRemove,
                        userIds,
                        teamIds,
                        bannedIds,
                        teamAdminIds,
                        userAdminIds,
                        deviceId,
                        callback,
                    });
                },
            });
        },
    });
}
export { createDevice };
export { removeDevice };
export { updateDevice };
export { getDeviceById };
export { getDevicesByUser };
export { updateAccess };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiZGV2aWNlcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbImRldmljZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsT0FBTyxFQUFFLFFBQVEsRUFBRSxNQUFNLDJCQUEyQixDQUFDO0FBRXJELE9BQU8sWUFBWSxNQUFNLHVCQUF1QixDQUFDO0FBQ2pELE9BQU8sYUFBYSxNQUFNLDBCQUEwQixDQUFDO0FBQ3JELE9BQU8sYUFBYSxNQUFNLG9CQUFvQixDQUFDO0FBUy9DLFNBQVMsYUFBYSxDQUFDLEVBQ3JCLEtBQUssRUFDTCxRQUFRLEVBQ1IsUUFBUSxFQUNSLGdCQUFnQixHQUNqQjtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLGdCQUFnQjtRQUNoQixXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSTtRQUNqRCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFdEIsYUFBYSxDQUFDO2dCQUNaLFFBQVE7Z0JBQ1IsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQUUsY0FBYyxFQUNyQixJQUFJLEVBQUUsYUFBYSxHQUNwQixFQUFFLEVBQUU7b0JBQ0gsSUFBSSxjQUFjLEVBQUUsQ0FBQzt3QkFDbkIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLGNBQWMsRUFBRSxDQUFDLENBQUM7d0JBRXBDLE9BQU87b0JBQ1QsQ0FBQztvQkFFRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsYUFBYSxDQUFDO29CQUVqQyxNQUFNLEVBQ0osTUFBTSxFQUNOLGFBQWEsR0FDZCxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUM7d0JBQzVCLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixNQUFNLEVBQUUsSUFBSTtxQkFDYixDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLE1BQU0sRUFBRSxDQUFDO3dCQUNaLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFFN0UsT0FBTztvQkFDVCxDQUFDO29CQUVELElBQUksQ0FBQyxhQUFhLEVBQUUsQ0FBQzt3QkFDbkIsUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsTUFBTSxFQUFFLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLEVBQUUsTUFBTSxFQUFFLENBQUMsRUFBRSxFQUFFLENBQUMsQ0FBQzt3QkFFOUUsT0FBTztvQkFDVCxDQUFDO29CQUVELFFBQVEsQ0FBQyxFQUFFLElBQUksRUFBRSxFQUFFLE1BQU0sRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDakMsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBVUQsU0FBUyxZQUFZLENBQUMsRUFDcEIsS0FBSyxFQUNMLE1BQU0sRUFDTixRQUFRLEVBQ1IsRUFBRSxFQUNGLE1BQU0sR0FDUDtJQUNDLGFBQWEsQ0FBQyxhQUFhLENBQUM7UUFDMUIsS0FBSztRQUNMLFdBQVcsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLFlBQVksQ0FBQyxJQUFJO1FBQ25ELFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUNMLElBQUksR0FDTCxFQUFFLEVBQUU7WUFDSCxJQUFJLEtBQUssRUFBRSxDQUFDO2dCQUNWLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxDQUFDLENBQUM7Z0JBRXBCLE9BQU87WUFDVCxDQUFDO1lBRUQsTUFBTSxFQUFFLElBQUksRUFBRSxHQUFHLElBQUksQ0FBQztZQUN0QixNQUFNLGNBQWMsR0FBRyxNQUFNLENBQUM7WUFDOUIsY0FBYyxDQUFDLE9BQU8sR0FBRyxJQUFJLENBQUMsUUFBUSxDQUFDO1lBRXZDLFlBQVksQ0FBQztnQkFDWCxNQUFNO2dCQUNOLFFBQVEsRUFBRSxDQUFDLFVBQVUsRUFBRSxFQUFFO29CQUN2QixJQUFJLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQzt3QkFDckIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFVBQVUsQ0FBQyxLQUFLLEVBQUUsQ0FBQyxDQUFDO3dCQUV0QyxPQUFPO29CQUNULENBQUM7b0JBRUQsTUFBTSxhQUFhLEdBQUcsVUFBVSxDQUFDLElBQUksQ0FBQyxNQUFNLENBQUM7b0JBQzdDLE1BQU0saUJBQWlCLEdBQUc7d0JBQ3hCLElBQUksRUFBRTs0QkFDSixRQUFRLEVBQUUsSUFBSTs0QkFDZCxNQUFNLEVBQUUsYUFBYTs0QkFDckIsVUFBVSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTTt5QkFDeEM7cUJBQ0YsQ0FBQztvQkFDRixNQUFNLFVBQVUsR0FBRzt3QkFDakIsSUFBSSxFQUFFOzRCQUNKLE1BQU0sRUFBRSxhQUFhLENBQUMsV0FBVyxDQUFDLEVBQUUsTUFBTSxFQUFFLGFBQWEsRUFBRSxDQUFDOzRCQUM1RCxVQUFVLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNO3lCQUN4QztxQkFDRixDQUFDO29CQUVGLElBQUksTUFBTSxFQUFFLENBQUM7d0JBQ1gsTUFBTSxDQUFDLFNBQVMsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7b0JBQy9ELENBQUM7eUJBQU0sQ0FBQzt3QkFDTixFQUFFLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDO3dCQUMvQyxFQUFFLENBQUMsRUFBRSxDQUFDLGFBQWEsQ0FBQyxRQUFRLENBQUM7NkJBQzFCLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxpQkFBaUIsQ0FBQyxDQUFDO29CQUN4RCxDQUFDO29CQUVELFFBQVEsQ0FBQyxpQkFBaUIsQ0FBQyxDQUFDO2dCQUM5QixDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFVRCxTQUFTLFlBQVksQ0FBQyxFQUNwQixLQUFLLEVBQ0wsTUFBTSxFQUNOLFFBQVEsRUFDUixPQUFPLEVBQ1AsUUFBUSxFQUNSLEVBQUUsRUFDRixNQUFNLEdBQ1A7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSTtRQUNuRCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBRWhDLGFBQWEsQ0FBQztnQkFDWixRQUFRO2dCQUNSLGdCQUFnQixFQUFFLFFBQVE7Z0JBQzFCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFdBQVcsRUFDbEIsSUFBSSxFQUFFLFVBQVUsR0FDakIsRUFBRSxFQUFFO29CQUNILElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2hCLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO3dCQUVqQyxPQUFPO29CQUNULENBQUM7b0JBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxXQUFXLEVBQUUsR0FBRyxVQUFVLENBQUM7b0JBQzNDLE1BQU0sRUFDSixhQUFhLEdBQ2QsR0FBRyxhQUFhLENBQUMsV0FBVyxDQUFDO3dCQUM1QixjQUFjLEVBQUUsV0FBVzt3QkFDM0IsTUFBTSxFQUFFLFFBQVE7cUJBQ2pCLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ25CLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxJQUFJLFlBQVksQ0FBQyxVQUFVLENBQUMsRUFBRSxJQUFJLEVBQUUsVUFBVSxRQUFRLEVBQUUsRUFBRSxDQUFDLEVBQUUsQ0FBQyxDQUFDO3dCQUVqRixPQUFPO29CQUNULENBQUM7b0JBRUQsWUFBWSxDQUFDO3dCQUNYLE9BQU87d0JBQ1AsTUFBTTt3QkFDTixRQUFRO3dCQUNSLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFdBQVcsRUFDbEIsSUFBSSxFQUFFLFVBQVUsR0FDakIsRUFBRSxFQUFFOzRCQUNILElBQUksV0FBVyxFQUFFLENBQUM7Z0NBQ2hCLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO2dDQUVqQyxPQUFPOzRCQUNULENBQUM7NEJBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsR0FBRyxVQUFVLENBQUM7NEJBQzdDLE1BQU0sV0FBVyxHQUFHO2dDQUNsQixJQUFJLEVBQUU7b0NBQ0osUUFBUSxFQUFFLElBQUk7b0NBQ2QsTUFBTSxFQUFFLGFBQWE7b0NBQ3JCLFVBQVUsRUFBRSxRQUFRLENBQUMsV0FBVyxDQUFDLE1BQU07aUNBQ3hDOzZCQUNGLENBQUM7NEJBQ0YsTUFBTSxVQUFVLEdBQUc7Z0NBQ2pCLElBQUksRUFBRTtvQ0FDSixNQUFNLEVBQUUsYUFBYSxDQUFDLFdBQVcsQ0FBQyxFQUFFLE1BQU0sRUFBRSxhQUFhLEVBQUUsQ0FBQztvQ0FDNUQsVUFBVSxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsTUFBTTtpQ0FDeEM7NkJBQ0YsQ0FBQzs0QkFFRixJQUFJLE1BQU0sRUFBRSxDQUFDO2dDQUNYLE1BQU0sQ0FBQyxTQUFTLENBQUMsSUFBSSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUMsTUFBTSxFQUFFLFVBQVUsQ0FBQyxDQUFDOzRCQUMvRCxDQUFDO2lDQUFNLENBQUM7Z0NBQ04sRUFBRSxDQUFDLElBQUksQ0FBQyxRQUFRLENBQUMsU0FBUyxDQUFDLE1BQU0sRUFBRSxVQUFVLENBQUMsQ0FBQztnQ0FDL0MsRUFBRSxDQUFDLEVBQUUsQ0FBQyxhQUFhLENBQUMsUUFBUSxDQUFDO3FDQUMxQixJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsV0FBVyxDQUFDLENBQUM7NEJBQ2xELENBQUM7NEJBRUQsUUFBUSxDQUFDLFdBQVcsQ0FBQyxDQUFDO3dCQUN4QixDQUFDO3FCQUNGLENBQUMsQ0FBQztnQkFDTCxDQUFDO2FBQ0YsQ0FBQyxDQUFDO1FBQ0wsQ0FBQztLQUNGLENBQUMsQ0FBQztBQUNMLENBQUM7QUFRRCxTQUFTLGdCQUFnQixDQUFDLEVBQ3hCLEtBQUssRUFDTCxRQUFRLEdBQ1Q7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxVQUFVLENBQUMsSUFBSTtRQUNqRCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFdEIsZ0JBQWdCLENBQUM7Z0JBQ2YsSUFBSTtnQkFDSixRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFBRSxlQUFlLEVBQ3RCLElBQUksRUFBRSxjQUFjLEdBQ3JCLEVBQUUsRUFBRTtvQkFDSCxJQUFJLGVBQWUsRUFBRSxDQUFDO3dCQUNwQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsZUFBZSxFQUFFLENBQUMsQ0FBQzt3QkFFckMsT0FBTztvQkFDVCxDQUFDO29CQUVELE1BQU0sRUFBRSxPQUFPLEVBQUUsR0FBRyxjQUFjLENBQUM7b0JBQ25DLE1BQU0sVUFBVSxHQUFHLE9BQU8sQ0FBQyxHQUFHLENBQUMsQ0FBQyxVQUFVLEVBQUUsRUFBRTt3QkFDNUMsTUFBTSxFQUNKLGFBQWEsR0FDZCxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUM7NEJBQzVCLE1BQU0sRUFBRSxJQUFJOzRCQUNaLGNBQWMsRUFBRSxVQUFVO3lCQUMzQixDQUFDLENBQUM7d0JBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDOzRCQUNuQixPQUFPLGFBQWEsQ0FBQyxXQUFXLENBQUMsRUFBRSxNQUFNLEVBQUUsVUFBVSxFQUFFLENBQUMsQ0FBQzt3QkFDM0QsQ0FBQzt3QkFFRCxPQUFPLFVBQVUsQ0FBQztvQkFDcEIsQ0FBQyxDQUFDLENBQUM7b0JBRUgsUUFBUSxDQUFDLEVBQUUsSUFBSSxFQUFFLEVBQUUsT0FBTyxFQUFFLFVBQVUsRUFBRSxFQUFFLENBQUMsQ0FBQztnQkFDOUMsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBVUQsU0FBUyxZQUFZLENBQUMsRUFDcEIsS0FBSyxFQUNMLFFBQVEsRUFDUixRQUFRLEVBQ1IsRUFBRSxHQUNIO0lBQ0MsYUFBYSxDQUFDLGFBQWEsQ0FBQztRQUMxQixLQUFLO1FBQ0wsV0FBVyxFQUFFLFFBQVEsQ0FBQyxXQUFXLENBQUMsWUFBWSxDQUFDLElBQUk7UUFDbkQsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQ0wsSUFBSSxHQUNMLEVBQUUsRUFBRTtZQUNILElBQUksS0FBSyxFQUFFLENBQUM7Z0JBQ1YsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLENBQUMsQ0FBQztnQkFFcEIsT0FBTztZQUNULENBQUM7WUFFRCxNQUFNLEVBQUUsSUFBSSxFQUFFLEdBQUcsSUFBSSxDQUFDO1lBRXRCLGFBQWEsQ0FBQztnQkFDWixRQUFRO2dCQUNSLGdCQUFnQixFQUFFLElBQUk7Z0JBQ3RCLFFBQVEsRUFBRSxDQUFDLEVBQ1QsS0FBSyxFQUFFLFdBQVcsRUFDbEIsSUFBSSxFQUFFLFVBQVUsR0FDakIsRUFBRSxFQUFFO29CQUNILElBQUksV0FBVyxFQUFFLENBQUM7d0JBQ2hCLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxXQUFXLEVBQUUsQ0FBQyxDQUFDO3dCQUVqQyxPQUFPO29CQUNULENBQUM7b0JBRUQsTUFBTSxFQUFFLE1BQU0sRUFBRSxHQUFHLFVBQVUsQ0FBQztvQkFDOUIsTUFBTSxFQUNKLGFBQWEsR0FDZCxHQUFHLGFBQWEsQ0FBQyxXQUFXLENBQUM7d0JBQzVCLGNBQWMsRUFBRSxNQUFNO3dCQUN0QixNQUFNLEVBQUUsSUFBSTtxQkFDYixDQUFDLENBQUM7b0JBRUgsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO3dCQUNuQixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsSUFBSSxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFFakYsT0FBTztvQkFDVCxDQUFDO29CQUVELFlBQVksQ0FBQzt3QkFDWCxRQUFRO3dCQUNSLFFBQVEsRUFBRSxDQUFDLEVBQUUsS0FBSyxFQUFFLGlCQUFpQixFQUFFLEVBQUUsRUFBRTs0QkFDekMsSUFBSSxpQkFBaUIsRUFBRSxDQUFDO2dDQUN0QixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsaUJBQWlCLEVBQUUsQ0FBQyxDQUFDO2dDQUV2QyxPQUFPOzRCQUNULENBQUM7NEJBRUQsTUFBTSxVQUFVLEdBQUc7Z0NBQ2pCLElBQUksRUFBRTtvQ0FDSixNQUFNLEVBQUUsRUFBRSxRQUFRLEVBQUUsUUFBUSxFQUFFO29DQUM5QixVQUFVLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxNQUFNO2lDQUN4Qzs2QkFDRixDQUFDOzRCQUVGLEVBQUUsQ0FBQyxJQUFJLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQyxNQUFNLEVBQUUsVUFBVSxDQUFDLENBQUM7NEJBRS9DLFFBQVEsQ0FBQyxVQUFVLENBQUMsQ0FBQzt3QkFDdkIsQ0FBQztxQkFDRixDQUFDLENBQUM7Z0JBQ0wsQ0FBQzthQUNGLENBQUMsQ0FBQztRQUNMLENBQUM7S0FDRixDQUFDLENBQUM7QUFDTCxDQUFDO0FBY0QsU0FBUyxZQUFZLENBQUMsRUFDcEIsS0FBSyxFQUNMLFFBQVEsRUFDUixZQUFZLEVBQ1osWUFBWSxFQUNaLE9BQU8sRUFDUCxPQUFPLEVBQ1AsU0FBUyxFQUNULFlBQVksRUFDWixRQUFRLEdBQ1Q7SUFDQyxhQUFhLENBQUMsYUFBYSxDQUFDO1FBQzFCLEtBQUs7UUFDTCxXQUFXLEVBQUUsUUFBUSxDQUFDLFdBQVcsQ0FBQyxZQUFZLENBQUMsSUFBSTtRQUNuRCxRQUFRLEVBQUUsQ0FBQyxFQUNULEtBQUssRUFDTCxJQUFJLEdBQ0wsRUFBRSxFQUFFO1lBQ0gsSUFBSSxLQUFLLEVBQUUsQ0FBQztnQkFDVixRQUFRLENBQUMsRUFBRSxLQUFLLEVBQUUsQ0FBQyxDQUFDO2dCQUVwQixPQUFPO1lBQ1QsQ0FBQztZQUVELE1BQU0sRUFBRSxJQUFJLEVBQUUsR0FBRyxJQUFJLENBQUM7WUFFdEIsYUFBYSxDQUFDO2dCQUNaLFFBQVE7Z0JBQ1IsZ0JBQWdCLEVBQUUsSUFBSTtnQkFDdEIsUUFBUSxFQUFFLENBQUMsRUFDVCxLQUFLLEVBQUUsV0FBVyxFQUNsQixJQUFJLEVBQUUsVUFBVSxHQUNqQixFQUFFLEVBQUU7b0JBQ0gsSUFBSSxXQUFXLEVBQUUsQ0FBQzt3QkFDaEIsUUFBUSxDQUFDLEVBQUUsS0FBSyxFQUFFLFdBQVcsRUFBRSxDQUFDLENBQUM7d0JBRWpDLE9BQU87b0JBQ1QsQ0FBQztvQkFFRCxNQUFNLEVBQUUsTUFBTSxFQUFFLEdBQUcsVUFBVSxDQUFDO29CQUU5QixNQUFNLEVBQ0osYUFBYSxHQUNkLEdBQUcsYUFBYSxDQUFDLFdBQVcsQ0FBQzt3QkFDNUIsY0FBYyxFQUFFLE1BQU07d0JBQ3RCLE1BQU0sRUFBRSxJQUFJO3FCQUNiLENBQUMsQ0FBQztvQkFFSCxJQUFJLENBQUMsYUFBYSxFQUFFLENBQUM7d0JBQ25CLFFBQVEsQ0FBQyxFQUFFLEtBQUssRUFBRSxZQUFZLENBQUMsVUFBVSxDQUFDLEVBQUUsSUFBSSxFQUFFLFVBQVUsUUFBUSxFQUFFLEVBQUUsQ0FBQyxFQUFFLENBQUMsQ0FBQzt3QkFFN0UsT0FBTztvQkFDVCxDQUFDO29CQUVELFlBQVksQ0FBQzt3QkFDWCxZQUFZO3dCQUNaLE9BQU87d0JBQ1AsT0FBTzt3QkFDUCxTQUFTO3dCQUNULFlBQVk7d0JBQ1osWUFBWTt3QkFDWixRQUFRO3dCQUNSLFFBQVE7cUJBQ1QsQ0FBQyxDQUFDO2dCQUNMLENBQUM7YUFDRixDQUFDLENBQUM7UUFDTCxDQUFDO0tBQ0YsQ0FBQyxDQUFDO0FBQ0wsQ0FBQztBQUVELE9BQU8sRUFBRSxZQUFZLEVBQUUsQ0FBQztBQUN4QixPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUM7QUFDeEIsT0FBTyxFQUFFLFlBQVksRUFBRSxDQUFDO0FBQ3hCLE9BQU8sRUFBRSxhQUFhLEVBQUUsQ0FBQztBQUN6QixPQUFPLEVBQUUsZ0JBQWdCLEVBQUUsQ0FBQztBQUM1QixPQUFPLEVBQUUsWUFBWSxFQUFFLENBQUMifQ==