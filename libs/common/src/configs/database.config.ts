import { registerAs } from '@nestjs/config';
import path = require('path');

export default registerAs('databaseConfig', () => ({
  type: process.env.TYPEORM_CONNECTION || 'postgres',
  host: process.env.TYPEORM_HOST,
  port: process.env.TYPEORM_PORT || 5432,
  username: process.env.TYPEORM_USERNAME,
  password: process.env.TYPEORM_PASSWORD,
  database: process.env.TYPEORM_DATABASE,
  entities: [
    path.join(__dirname, '../../../../apps/**/*.entity{.ts,.js}'),
    path.join(__dirname, '../../../../libs/**/*.entity{.ts,.js}'),
  ],
  subscribers: [
    path.join(__dirname, '../../../../apps/**/*.subscriber{.ts,.js}'),
    path.join(__dirname, '../../../../libs/**/*.subscriber{.ts,.js}'),
  ],
  synchronize: process.env.TYPEORM_SYNCHRONIZE === 'true',
  logging: process.env.TYPEORM_LOGGING === 'true',
  migrationsTableName: 'migrations',
  migrations: [path.join(__dirname, '../../../../libs/database/src/migrations/*{.ts,.js')],
  charset: 'utf8mb4_unicode_ci',
  seeds: [path.join(__dirname, '../../../../libs/database/src/seeds/**/*{.ts,.js}')],
  factories: [path.join(__dirname, '../../../../libs/database/src/factories/**/*{.ts,.js}')],
  cli: {
    entitiesDir: 'src/**/',
    migrationsDir: process.env.TYPEORM_MIGRATIONS_DIR,
  },
  legacySpatialSupport: false,
  extra: {
    connectionLimit: process.env.POSTGRESQL_CONNECTION_LIMIT || 200,
    waitForConnections: process.env.POSTGRESQL_WAIT_FOR_CONNECTIONS === 'true',
  },
  poolSize: process.env.TYPEORM_POOL_SIZE,
  ssl: { rejectUnauthorized: process.env.POSTGRESQL_TLS === 'true' },
}));
