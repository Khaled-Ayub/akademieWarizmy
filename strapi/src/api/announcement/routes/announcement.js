'use strict';

/**
 * announcement router
 * Standard-Router für Ankündigungen
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::announcement.announcement');

