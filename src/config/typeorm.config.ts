import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';

config();

export const typeOrmConfig: DataSourceOptions = {
  type: 'mariadb',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  username: process.env.DB_USERNAME || 'serversonnetguru_LMS',
  password: process.env.DB_PASSWORD || '?D#+D6WJjI4]A^1o',
  database: process.env.DB_DATABASE || 'serversonnetguru_LMS',
  entities: [__dirname + '/../**/*.entity{.ts,.js}'],
  migrations: [__dirname + '/../database/migrations/*{.ts,.js}'],
  synchronize: false, // Never use true in production
  logging: process.env.NODE_ENV === 'development',
  charset: 'utf8mb4',
  timezone: 'Z',
};

const dataSource = new DataSource(typeOrmConfig);
export default dataSource;
