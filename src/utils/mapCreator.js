'use strict';
const request = require('request');
const xml2json = require('xml2json');
const { appConfig, dbConfig, } = require('../config/defaults/config');
function convertToJson(xml) {
    return JSON.parse(xml2json.toJson(xml));
}
function parseGoogleCoords(string) {
    return string.replace(/,0/g, '')
        .split(/[,|\n]/);
}
function createCoordsCollection(coords) {
    const coordsCollection = [];
    for (let i = 0; i < coords.length; i += 2) {
        const latitude = coords[i + 1];
        const longitude = coords[i];
        coordsCollection.push({
            accuracy: appConfig.minimumPositionAccuracy,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
        });
    }
    return coordsCollection;
}
function createPosition({ position, layerName, }) {
    const coordinates = {};
    let geometry = '';
    let positionStructure;
    if (position.Polygon || position.LineString) {
        let coordsCollection;
        if (position.Polygon) {
            coordsCollection = createCoordsCollection(parseGoogleCoords(position.Polygon.outerBoundaryIs.LinearRing.coordinates));
            geometry = 'polygon';
            positionStructure = dbConfig.PositionStructures.POLYGON;
        }
        else {
            coordsCollection = createCoordsCollection(parseGoogleCoords(position.LineString.coordinates));
            geometry = 'line';
            positionStructure = dbConfig.PositionStructures.LINE;
        }
        const firstCoordinates = coordsCollection.shift();
        coordinates.longitude = firstCoordinates.longitude;
        coordinates.latitude = firstCoordinates.latitude;
        coordinates.extraCoordinates = coordsCollection;
    }
    else if (position.Point) {
        [coordinates.longitude, coordinates.latitude] = position.Point.coordinates.split(',');
        geometry = 'point';
        positionStructure = dbConfig.PositionStructures.MARKER;
    }
    return {
        coordinates,
        geometry,
        positionStructure,
        accessLevel: appConfig.importedPositionMinAccessLevel,
        origin: dbConfig.PositionOrigins.GOOGLE,
        positionName: typeof position.name === 'string'
            ?
                position.name
            :
                'Unnamed position',
        isStationary: true,
        positionType: layerName.toLowerCase(),
        description: position.description
            ?
                position.description.replace(/<img .+?\/>/, '')
                    .split(/<br>/)
            :
                [],
    };
}
function getGooglePositions({ callback }) {
    if (!appConfig.mapLayersPath) {
        callback({
            error: {
                note: 'Map layers path is not set',
                positions: [],
            },
        });
        return;
    }
    request.get(appConfig.mapLayersPath, (err, response, body) => {
        if (err || response.statusCode !== 200) {
            callback({
                error: {
                    note: 'Unable to get positions from Google',
                    positions: [],
                },
            });
            return;
        }
        const positions = [];
        const layers = convertToJson(body).kml.Document.Folder;
        layers.forEach((layer) => {
            if (layer.Placemark) {
                layer.Placemark.forEach((position) => {
                    positions.push(createPosition({
                        position,
                        layerName: layer.name,
                    }));
                });
            }
        });
        callback({ data: { positions } });
    });
}
function getDistance(p1, p2) {
    const radiusFunc = (x) => {
        return (x * Math.PI) / 180;
    };
    const earthRadius = 6378137;
    const latDistance = radiusFunc(p2.latitude - p1.latitude);
    const longDistance = radiusFunc(p2.longitude - p1.longitude);
    const a = (Math.sin(latDistance / 2) * Math.sin(latDistance / 2)) + (Math.cos(radiusFunc(p1.latitude)) * Math.cos(radiusFunc(p2.latitude)) * Math.sin(longDistance / 2) * Math.sin(longDistance / 2));
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadius * c;
}
export { getGooglePositions };
export { getDistance };
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWFwQ3JlYXRvci5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIm1hcENyZWF0b3IudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUEsWUFBWSxDQUFDO0FBRWIsTUFBTSxPQUFPLEdBQUcsT0FBTyxDQUFDLFNBQVMsQ0FBQyxDQUFDO0FBQ25DLE1BQU0sUUFBUSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsQ0FBQztBQUNyQyxNQUFNLEVBQ0osU0FBUyxFQUNULFFBQVEsR0FDVCxHQUFHLE9BQU8sQ0FBQywyQkFBMkIsQ0FBQyxDQUFDO0FBT3pDLFNBQVMsYUFBYSxDQUFDLEdBQUc7SUFDeEIsT0FBTyxJQUFJLENBQUMsS0FBSyxDQUFDLFFBQVEsQ0FBQyxNQUFNLENBQUMsR0FBRyxDQUFDLENBQUMsQ0FBQztBQUMxQyxDQUFDO0FBT0QsU0FBUyxpQkFBaUIsQ0FBQyxNQUFNO0lBQy9CLE9BQU8sTUFBTSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsRUFBRSxDQUFDO1NBQzdCLEtBQUssQ0FBQyxRQUFRLENBQUMsQ0FBQztBQUNyQixDQUFDO0FBT0QsU0FBUyxzQkFBc0IsQ0FBQyxNQUFNO0lBQ3BDLE1BQU0sZ0JBQWdCLEdBQUcsRUFBRSxDQUFDO0lBRTVCLEtBQUssSUFBSSxDQUFDLEdBQUcsQ0FBQyxFQUFFLENBQUMsR0FBRyxNQUFNLENBQUMsTUFBTSxFQUFFLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQztRQUMxQyxNQUFNLFFBQVEsR0FBRyxNQUFNLENBQUMsQ0FBQyxHQUFHLENBQUMsQ0FBQyxDQUFDO1FBQy9CLE1BQU0sU0FBUyxHQUFHLE1BQU0sQ0FBQyxDQUFDLENBQUMsQ0FBQztRQVk1QixnQkFBZ0IsQ0FBQyxJQUFJLENBQUM7WUFDcEIsUUFBUSxFQUFFLFNBQVMsQ0FBQyx1QkFBdUI7WUFDM0MsUUFBUSxFQUFFLFVBQVUsQ0FBQyxRQUFRLENBQUM7WUFDOUIsU0FBUyxFQUFFLFVBQVUsQ0FBQyxTQUFTLENBQUM7U0FDakMsQ0FB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