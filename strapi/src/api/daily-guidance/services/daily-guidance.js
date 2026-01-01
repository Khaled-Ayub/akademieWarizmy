'use strict';

/**
 * daily-guidance service
 * Standard-Service für Tageshinweise
 */

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::daily-guidance.daily-guidance');


