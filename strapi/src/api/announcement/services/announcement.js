'use strict';

/**
 * announcement service
 * Standard-Service für Ankündigungen
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::announcement.announcement');

