// ===========================================
// WARIZMY EDUCATION - Strapi Datenbank-Konfiguration
// ===========================================

module.exports = ({ env }) => ({
  connection: {
    // PostgreSQL verwenden
    client: 'postgres',
    connection: {
      host: env('DATABASE_HOST', 'localhost'),
      port: env.int('DATABASE_PORT', 5432),
      database: env('DATABASE_NAME', 'warizmy_strapi'),
      user: env('DATABASE_USERNAME', 'warizmy'),
      password: env('DATABASE_PASSWORD', 'password'),
      ssl: env.bool('DATABASE_SSL', false) && {
        rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true),
      },
    },
    // Pool-Einstellungen
    pool: {
      min: env.int('DATABASE_POOL_MIN', 2),
      max: env.int('DATABASE_POOL_MAX', 10),
    },
    // Timeout
    acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
  },
});

