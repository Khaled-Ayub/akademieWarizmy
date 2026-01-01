/**
 * AI Assistant Admin Plugin
 * Registriert das Plugin im Strapi Admin-Panel
 */
import { prefixPluginTranslations } from '@strapi/helper-plugin';
import pluginId from './pluginId';
import PluginIcon from './components/PluginIcon';

export default {
  register(app) {
    // Plugin im Hauptmenü registrieren
    app.addMenuLink({
      to: `/plugins/${pluginId}`,
      icon: PluginIcon,
      intlLabel: {
        id: `${pluginId}.plugin.name`,
        defaultMessage: 'AI Assistent',
      },
      Component: async () => {
        const component = await import('./pages/HomePage');
        return component;
      },
      permissions: [],
    });

    // Plugin in Strapi registrieren
    app.registerPlugin({
      id: pluginId,
      name: pluginId,
    });
  },

  bootstrap(app) {
    // Wird beim Start ausgeführt
  },

  async registerTrads({ locales }) {
    // Deutsche Übersetzungen
    const importedTrads = [
      {
        data: {
          [`${pluginId}.plugin.name`]: 'AI Assistent',
          [`${pluginId}.header.title`]: 'AI Assistent',
          [`${pluginId}.header.description`]: 'Nutze KI um Texte zu generieren, verbessern und übersetzen',
        },
        locale: 'de',
      },
      {
        data: {
          [`${pluginId}.plugin.name`]: 'AI Assistant',
          [`${pluginId}.header.title`]: 'AI Assistant',
          [`${pluginId}.header.description`]: 'Use AI to generate, improve and translate texts',
        },
        locale: 'en',
      },
    ];

    return Promise.resolve(importedTrads);
  },
};

