'use strict';

const express = require('express');
const { appConfig } = require('../config/defaults/config');

const router = new express.Router();

/**
 * @returns {Object} Router
 */
function handle() {
  router.get('/', (req, res) => {
    res.status(404)
      .render('error', { title: `${appConfig.title} - Error` });
  });
  return router;
}

export default handle;
