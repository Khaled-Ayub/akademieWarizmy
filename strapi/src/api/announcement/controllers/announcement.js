'use strict';

/**
 * announcement controller
 * Standard-Controller für Ankündigungen
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::announcement.announcement');

