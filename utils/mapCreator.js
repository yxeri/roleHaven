/*
 Copyright 2015 Aleksandar Jankovic

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
    if (!isNaN(parseInt(longitude.substr(0, 2), 10)) && coords[i].charAt(2) !== '.') {
      longitude = `${coords[i].substr(0, 2)}.${coords[i].substr(2)}`;
    } else if (!isNaN(parseInt(latitude.substr(0, 2), 10)) && coords[i + 1].charAt(2) !== '.') {
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
 * @param {Object} placemark - Google Maps position
 * @param {string} placemark.name - Google Maps position name
 * @param {string} [placemark.description] - Google Maps position description
 * @param {Object} [placemark.Polygon] - Google Maps position polygon
 * @param {string} placemark.Polygon.outerBoundaryIs.LinearRing.coordinates - Google Maps polygon coordinates
 * @param {Object} [placemark.LineString] - Google Maps position line
 * @param {string} placemark.LineString.coordinates - Google Maps line coordinates
 * @param {Object} [placemark.Point] - Google Maps position point
 * @returns {{positionName: string, position: Object, isStatic: boolean, type: string, geometry: string, description: string}} New position
 */
function createPosition(placemark) {
  const position = {};
  let geometry = '';

  if (placemark.Polygon) {
    position.coordsCollection = createCoordsCollection(parseGoogleCoords(placemark.Polygon.outerBoundaryIs.LinearRing.coordinates));
    geometry = 'polygon';
  } else if (placemark.LineString) {
    position.coordsCollection = createCoordsCollection(parseGoogleCoords(placemark.LineString.coordinates));
    geometry = 'line';
  } else if (placemark.Point) {
    position.latitude = placemark.Point.coordinates.split(',')[1];
    position.longitude = placemark.Point.coordinates.split(',')[0];
    geometry = 'point';
  }

  return {
    positionName: placemark.name,
    position,
    isStatic: true,
    type: 'world',
    geometry,
    description: placemark.description ? placemark.description.replace(/<br>/g, '') : 'No information',
  };
}

/**
 * Get Google Maps positions
 * @param {Function} callback - Callback
 */
function getGooglePositions(callback) {
  request.get(appConfig.mapLayersPath, (err, response, body) => {
    if (err || response.statusCode !== 200) {
      callback(err || true);

      return;
    }

    const positions = [];
    /**
     * @type {{ kml: Object, Document: Object, Folder: Object }}
     */
    const layers = convertToJson(body).kml.Document.Folder;

    for (const layerKey of Object.keys(layers)) {
      /**
       * @type {{ Placemark: Object }}
       */
      const layer = layers[layerKey];

      // Placemark can be either an object or an array with objects
      if (layer.Placemark) {
        if (layer.Placemark.length > 0) {
          for (let i = 0; i < layer.Placemark.length; i += 1) {
            positions.push(createPosition(layer.Placemark[i]));
          }
        } else {
          positions.push(createPosition(layer.Placemark));
        }
      }
    }

    callback(err, positions);
  });
}

exports.getGooglePositions = getGooglePositions;
