const baseObjects = require('../schemas/baseObjects');

/**
 * Create a randomized string.
 * @param {Object} params Parameters.
 * @param {number} params.length Length of string.
 * @returns {string} Randomized string.
 */
function createRandString({ length }) {
  const selection = 'abcdefghijklmnopqrstuvwxyz0123456789';
  const randomLength = selection.length;
  let result = '';

  for (let i = 0; i < length; i += 1) {
    const randomVal = Math.round(Math.random() * (randomLength - 1));

    result += selection[randomVal];
  }

  return result;
}

/**
 * Create a lite schema with base and specific objects. A lite schema has some properties stripped away from the base and specific objects.
 * @param {Object} schema Specific object schema.
 * @return {Object} Lite object schema.
 */
function buildLiteSchema(schema) {
  const updatedSchema = schema;
  const baseObjectSchema = baseObjects.liteBaseObject;

  updatedSchema.required = baseObjectSchema.required.concat(schema.required);
  Object.keys(baseObjectSchema.properties).forEach((key) => {
    updatedSchema.properties[key] = baseObjectSchema.properties[key];
  });

  return updatedSchema;
}

/**
 * Create a complete schema with base and specific objects.
 * @param {Object} schema Specific object schema.
 * @return {Object} Full object schema.
 */
function buildFullSchema(schema) {
  const updatedSchema = schema;
  const baseObjectSchema = baseObjects.fullBaseObject;

  updatedSchema.required = baseObjectSchema.required.concat(schema.required);
  Object.keys(baseObjectSchema.properties).forEach((key) => {
    updatedSchema.properties[key] = baseObjectSchema.properties[key];
  });

  return updatedSchema;
}

exports.createRandString = createRandString;
exports.buildFullSchema = buildFullSchema;
exports.buildLiteSchema = buildLiteSchema;
