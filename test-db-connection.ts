import { DataSource } from 'typeorm';
import { config } from 'dotenv';

config();

async function testConnection() {
  console.log('Testing database connection...');
  console.log('Host:', process.env.DB_HOST);
  console.log('Port:', process.env.DB_PORT);
  console.log('Username:', process.env.DB_USERNAME);
  console.log('Database:', process.env.DB_DATABASE);
  console.log('Password length:', process.env.DB_PASSWORD?.length);

  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
  });

  try {
    await dataSource.initialize();
    console.log('✅ Connection successful!');

    const result = await dataSource.query('SELECT VERSION() as version');
    console.log('MariaDB/MySQL Version:', result[0].version);

    await dataSource.destroy();
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
}

testConnection();
