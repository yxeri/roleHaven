/*
 Copyright 2017 Aleksandar Jankovic

 Licensed under the Apache License, Version 2.0 (the "License");
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 */

'use strict';

const appConfig = require('../config/defaults/config').app;
const request = require('request');
const xml2json = require('xml2json');

/**
 * Convert xml to json
 * @param {Object} xml - XML data
 * @returns {Object} JSON
 */
function convertToJson(xml) {
  return JSON.parse(xml2json.toJson(xml));
}

/**
 * Parse and clean up coordinates from Google Maps
 * @param {string} string - Coordinate string
 * @returns {string[]} Coordinates
 */
function parseGoogleCoords(string) {
  return string.replace(/0\.0 |0\.0/g, '').replace(/,$/g, '').split(',');
}

/**
 * Creates a collection of all Google coordinates
 * @param {string[]} coords - Coordinates from Google maps
 * @returns {{lat: number, lng: number}[]} Collection with positions (latitudes and longitudes)
 */
function createCoordsCollection(coords) {
  const coordsCollection = [];

  for (let i = 0; i < coords.length; i += 2) {
    let latitude = coords[i + 1];
    let longitude = coords[i];

    /**
     * Google Maps bugs out and will sometimes send large integer instead of double (64.5565 becomes 645565)
     * This adds a dot where needed
     */
    if (!Number.isNaN(parseInt(longitude.substr(0, 2), 10)) && coords[i].charAt(2) !== '.') {
      longitude = `${coords[i].substr(0, 2)}.${coords[i].substr(2)}`;
    } else if (!Number.isNaN(parseInt(latitude.substr(0, 2), 10)) && coords[i + 1].charAt(2) !== '.') {
      latitude = `${coords[i + 1].substr(0, 2)}.${coords[i + 1].substr(2)}`;
    }

    coordsCollection.push({
      lat: parseFloat(latitude),
      lng: parseFloat(longitude),
    });
  }

  return coordsCollection;
}

/**
 * Create and return a position with a position from Google Maps as base
 * @param {Object} params - Parameters.
 * @param {Object} params.position - Google Maps position
 * @param {string} params.position.name - Google Maps position name
 * @param {string} [params.position.description] - Google Maps position description
 * @param {Object} [params.position.Polygon] - Google Maps position polygon
 * @param {string} params.position.Polygon.outerBoundaryIs.LinearRing.coordinates - Google Maps polygon coordinates
 * @param {Object} [params.position.LineString] - Google Maps position line
 * @param {string} params.position.LineString.coordinates - Google Maps line coordinates
 * @param {Object} [params.position.Point] - Google Maps position point
 * @param {string} params.layerName - Name of the layer
 * @returns {{positionName: string, position: Object, isStationary: boolean, type: string, geometry: string, description: string[]}} New position
 */
function createPosition({ position, layerName }) {
  const coordinates = {};
  let geometry = '';

  if (position.Polygon) {
    coordinates.coordsCollection = createCoordsCollection(parseGoogleCoords(position.Polygon.outerBoundaryIs.LinearRing.coordinates));
    geometry = 'polygon';
  } else if (position.LineString) {
    coordinates.coordsCollection = createCoordsCollection(parseGoogleCoords(position.LineString.coordinates));
    geometry = 'line';
  } else if (position.Point) {
    [coordinates.longitude, coordinates.latitude] = position.Point.coordinates.split(',');
    geometry = 'point';
  }

  return {
    positionName: position.name,
    isStationary: true,
    markerType: layerName.toLowerCase(),
    description: position.description ? position.description.replace(/<img .+?\/>/, '').split(/<br>/) : ['No information'],
    coordinates,
    geometry,
  };
}

/**
 * Get Google Maps positions.
 * @param {Object} params - Parameters.
 * @param {Function} params.callback - Callback.
 */
function getGooglePositions({ callback }) {
  if (!appConfig.mapLayersPath) {
    callback({ data: { note: 'Map layers path is not set', positions: [] } });

    return;
  }

  request.get(appConfig.mapLayersPath, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      callback({ data: { note: 'Unable to get positions from Google', positions: [] } });

      return;
    }

    const positions = [];
    /**
     * @type {{ kml: Object, Document: Object, Folder: Object }}
     */
    const layers = convertToJson(body).kml.Document.Folder;

    layers.forEach((layer) => {
      layer.Placemark.forEach((position) => {
        positions.push(createPosition({ position, layerName: layer.name }));
      });
    });

    callback({ data: { positions } });
  });
}

/**
 * Checks distane between two points.
 * @param {Object} p1 Point 1 coordinates.
 * @param {Object} p2 Point 2 coordiantes.
 * @returns {number} Returns distance in meters.
 */
function getDistance(p1, p2) {
  const radiusFunc = (x) => { return (x * Math.PI) / 180; };

  const earthRadius = 6378137; // Earth’s mean radius in meter
  const latDistance = radiusFunc(p2.latitude - p1.latitude);
  const longDistance = radiusFunc(p2.longitude - p1.longitude);
  const a = (Math.sin(latDistance / 2) * Math.sin(latDistance / 2)) + (Math.cos(radiusFunc(p1.latitude)) * Math.cos(radiusFunc(p2.latitude)) * Math.sin(longDistance / 2) * Math.sin(longDistance / 2));
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c; // returns the distance in meter
}

exports.getGooglePositions = getGooglePositions;
exports.getDistance = getDistance;
