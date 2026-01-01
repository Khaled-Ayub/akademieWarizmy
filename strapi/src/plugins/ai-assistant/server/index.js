'use strict';

// Plugin-Server Einstiegspunkt
module.exports = {
  register({ strapi }) {
    // Plugin registrieren
  },
  bootstrap({ strapi }) {
    // Plugin starten
  },
  controllers: require('./controllers'),
  routes: require('./routes'),
  services: require('./services'),
};

