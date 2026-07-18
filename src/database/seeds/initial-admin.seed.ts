import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { config } from 'dotenv';

config();

async function seedInitialAdmin() {
  const dataSource = new DataSource({
    type: 'mysql',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    username: process.env.DB_USERNAME || 'root',
    password: process.env.DB_PASSWORD || 'password',
    database: process.env.DB_DATABASE || 'lms_platform',
  });

  try {
    await dataSource.initialize();
    console.log('Database connected for seeding...');

    const queryRunner = dataSource.createQueryRunner();

    // Check if admin already exists
    const existingAdmin = await queryRunner.query(
      `SELECT id FROM users WHERE email = ? LIMIT 1`,
      ['admin@lmsplatform.com'],
    );

    if (existingAdmin.length > 0) {
      console.log('Admin user already exists. Skipping...');
      await queryRunner.release();
      await dataSource.destroy();
      return;
    }

    // Create admin user
    const hashedPassword = await bcrypt.hash('Admin@123456', 10);
    const adminId = require('crypto').randomUUID();

    await queryRunner.query(
      `INSERT INTO users (id, name, email, password, role, isActive, activeSessions) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        adminId,
        'Super Administrator',
        'admin@lmsplatform.com',
        hashedPassword,
        'Super Admin',
        true,
        JSON.stringify([]),
      ],
    );

    console.log('✅ Initial admin user created successfully!');
    console.log('-----------------------------------');
    console.log('Email: admin@lmsplatform.com');
    console.log('Password: Admin@123456');
    console.log('-----------------------------------');
    console.log('⚠️  IMPORTANT: Change this password after first login!');

    await queryRunner.release();
    await dataSource.destroy();
  } catch (error) {
    console.error('Error seeding admin user:', error);
    process.exit(1);
  }
}

seedInitialAdmin();
