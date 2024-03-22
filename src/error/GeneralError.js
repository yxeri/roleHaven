import configs from '../config/defaults/index.js';
const { appConfig } = configs;
export var ErrorTypes;
(function (ErrorTypes) {
    ErrorTypes["GENERAL"] = "general error";
    ErrorTypes["DATABASE"] = "database";
    ErrorTypes["DOESNOTEXIST"] = "does not exist";
    ErrorTypes["EXTERNAL"] = "external";
    ErrorTypes["ALREADYEXISTS"] = "already exists";
    ErrorTypes["INCORRECT"] = "incorrect";
    ErrorTypes["INVALIDCHARACTERS"] = "invalid characters";
    ErrorTypes["INVALIDDATA"] = "invalid data";
    ErrorTypes["INVALIDLENGTH"] = "invalid length";
    ErrorTypes["NOTALLOWED"] = "not allowed";
    ErrorTypes["NEEDSVERIFICATION"] = "needs verification";
    ErrorTypes["BANNED"] = "banned";
    ErrorTypes["INSUFFICIENT"] = "insufficient";
    ErrorTypes["INTERNAL"] = "general internal error";
    ErrorTypes["EXPIRED"] = "expired";
    ErrorTypes["INVALIDMAIL"] = "invalid mail";
    ErrorTypes["TOOFREQUENT"] = "too frequent";
})(ErrorTypes || (ErrorTypes = {}));
function printError(errorObject) {
    if (errorObject) {
        if (errorObject.name) {
            console.error(errorObject.name);
        }
        if (errorObject.message) {
            console.error(errorObject.message);
        }
        if (errorObject.stack) {
            console.error(errorObject.stack);
        }
    }
}
class GeneralError {
    text;
    type;
    extraData;
    constructor({ errorObject, extraData, suppressPrint, text = ['Something went wrong'], type = ErrorTypes.GENERAL, verbose = true, }) {
        this.text = text;
        this.type = type;
        this.extraData = extraData;
        if ((appConfig.verboseError || verbose) && !suppressPrint) {
            console.error(`Error Type: ${type}. `, text.join(' ')
                .replace(/"password": ".*"/g, '"password": true'));
            printError(errorObject);
        }
    }
}
export default GeneralError;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiR2VuZXJhbEVycm9yLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiR2VuZXJhbEVycm9yLnRzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBLE9BQU8sT0FBTyxNQUFNLDZCQUE2QixDQUFDO0FBRWxELE1BQU0sRUFBRSxTQUFTLEVBQUUsR0FBRyxPQUFPLENBQUM7QUFpQjlCLE1BQU0sQ0FBTixJQUFZLFVBa0JYO0FBbEJELFdBQVksVUFBVTtJQUNwQix1Q0FBeUIsQ0FBQTtJQUN6QixtQ0FBcUIsQ0FBQTtJQUNyQiw2Q0FBK0IsQ0FBQTtJQUMvQixtQ0FBcUIsQ0FBQTtJQUNyQiw4Q0FBZ0MsQ0FBQTtJQUNoQyxxQ0FBdUIsQ0FBQTtJQUN2QixzREFBd0MsQ0FBQTtJQUN4QywwQ0FBNEIsQ0FBQTtJQUM1Qiw4Q0FBZ0MsQ0FBQTtJQUNoQyx3Q0FBMEIsQ0FBQTtJQUMxQixzREFBd0MsQ0FBQTtJQUN4QywrQkFBaUIsQ0FBQTtJQUNqQiwyQ0FBNkIsQ0FBQTtJQUM3QixpREFBbUMsQ0FBQTtJQUNuQyxpQ0FBbUIsQ0FBQTtJQUNuQiwwQ0FBNEIsQ0FBQTtJQUM1QiwwQ0FBNEIsQ0FBQTtBQUM5QixDQUFDLEVBbEJXLFVBQVUsS0FBVixVQUFVLFFBa0JyQjtBQUVELFNBQVMsVUFBVSxDQUFDLFdBSW5CO0lBQ0MsSUFBSSxXQUFXLEVBQUUsQ0FBQztRQUNoQixJQUFJLFdBQVcsQ0FBQyxJQUFJLEVBQUUsQ0FBQztZQUNyQixPQUFPLENBQUMsS0FBSyxDQUFDLFdBQVcsQ0FBQyxJQUFJLENBQUMsQ0FBQztRQUNsQyxDQUFDO1FBQ0QsSUFBSSxXQUFXLENBQUMsT0FBTyxFQUFFLENBQUM7WUFDeEIsT0FBTyxDQUFDLEtBQUssQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLENBQUM7UUFDckMsQ0FBQztRQUNELElBQUksV0FBVyxDQUFDLEtBQUssRUFBRSxDQUFDO1lBQ3RCLE9BQU8sQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLEtBQUssQ0FBQyxDQUFDO1FBQ25DLENBQUM7SUFDSCxDQUFDO0FBQ0gsQ0FBQztBQUVELE1BQU0sWUFBWTtJQUNULElBQUksQ0FBNEI7SUFDaEMsSUFBSSxDQUE0QjtJQUNoQyxTQUFTLENBQWlDO0lBRWpELFlBQVksRUFDVixXQUFXLEVBQ1gsU0FBUyxFQUNULGFBQWEsRUFDYixJQUFJLEdBQUcsQ0FBQyxzQkFBc0IsQ0FBQyxFQUMvQixJQUFJLEdBQUcsVUFBVSxDQUFDLE9BQU8sRUFDekIsT0FBTyxHQUFHLElBQUksR0FDSTtRQUNsQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsSUFBSSxHQUFHLElBQUksQ0FBQztRQUNqQixJQUFJLENBQUMsU0FBUyxHQUFHLFNBQVMsQ0FBQztRQUUzQixJQUFJLENBQUMsU0FBUyxDQUFDLFlBQVksSUFBSSxPQUFPLENBQUMsSUFBSSxDQUFDLGFBQWEsRUFBRSxDQUFDO1lBQzFELE9BQU8sQ0FBQyxLQUFLLENBQUMsZUFBZSxJQUFJLElBQUksRUFBRSxJQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQztpQkFDbEQsT0FBTyxDQUFDLG1CQUFtQixFQUFFLGtCQUFrQixDQUFDLENBQUMsQ0FBQztZQUNyRCxVQUFVLENBQUMsV0FJVixDQUFDLENBQUM7UUFDTCxDQUFDO0lBQ0gsQ0FBQztDQUNGO0FBRUQsZUFBZSxZQUFZLENBQUMifQ==