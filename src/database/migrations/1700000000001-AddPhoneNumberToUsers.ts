import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddPhoneNumberToUsers1700000000001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add phoneNumber column to users table
    await queryRunner.query(`
      ALTER TABLE users 
      ADD COLUMN phoneNumber VARCHAR(20) NULL 
      AFTER email
    `);

    // Add index for faster phone number lookups
    await queryRunner.query(`
      CREATE INDEX idx_users_phone ON users(phoneNumber)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop index
    await queryRunner.query(`
      DROP INDEX idx_users_phone ON users
    `);

    // Remove phoneNumber column
    await queryRunner.query(`
      ALTER TABLE users 
      DROP COLUMN phoneNumber
    `);
  }
}
