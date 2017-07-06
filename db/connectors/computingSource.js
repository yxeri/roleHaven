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

const mongoose = require('mongoose');
const dbConnector = require('../databaseConnector');
const errorCreator = require('../../objects/error/errorCreator');

const computingSourceSchema = new mongoose.Schema({
  isActive: { type: Boolean, default: false },
  sourceName: { type: String, unique: true },
  slots: [{
    owner: String,
    power: Number,
  }],
}, { collection: 'computingSources' });

const ComputingSource = mongoose.model('ComputingSource', computingSourceSchema);

/**
 * Get active computing sources
 * @param {Function} params.callback Callback
 */
function getSources({ callback }) {
  const query = {};

  ComputingSource.find(query).lean().exec((err, sources) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { sources } });
  });
}

/**
 * Activate/deactivate a source
 * @param {string} params.sourceName Name of the computing source
 * @param {boolean} params.isActive Is the source active?
 * @param {Function} params.callback Callback
 */
function setActiveSource({ sourceName, isActive, callback }) {
  const query = { sourceName };
  const update = { $set: { isActive } };
  const options = { new: true };

  ComputingSource.findOneAndUpdate(query, update, options).lean().exec((err, source) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { source } });
  });
}

/**
 * Get source by its name
 * @param {string} params.sourceName Name of the source
 * @param {Function} params.callback Callback
 */
function getSourceByName({ sourceName, callback }) {
  const query = { sourceName };

  ComputingSource.findOne(query).lean().exec((err, source) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err }) });

      return;
    }

    callback({ data: { source } });
  });
}

/**
 * Create a new source
 * @param {Object} params.source New source
 * @param {Function} paramscallback Callback
 */
function createSource({ source, callback }) {
  const newSource = new ComputingSource(source);
  const query = { sourceName: source.sourceName };

  // Checks if history for room already exists
  ComputingSource.findOne(query).lean().exec((err, foundSource) => {
    if (err) {
      callback({ error: new errorCreator.Database({ errorObject: err, name: 'createSource' }) });

      return;
    } else if (foundSource) {
      callback({ error: new errorCreator.AlreadyExists({ name: `Computing source ${foundSource.sourceName}` }) });

      return;
    }

    dbConnector.saveObject({
      callback,
      object: newSource,
      objectType: 'ComputingSource',
    });
  });
}

exports.getSources = getSources;
exports.setActiveSource = setActiveSource;
exports.getSourceByName = getSourceByName;
exports.createSource = createSource;
