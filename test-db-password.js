const { Pool } = require('pg');

const passwords = [
  'blendee9312!',
  'song9312!',
  'Blendee2024!',
  'blendee9312',
  'song9312'
];

async function testPasswords() {
  for (const password of passwords) {
    const pool = new Pool({
      host: 'blendee-db.c9iiiga2sa44.ap-northeast-2.rds.amazonaws.com',
      port: 5432,
      user: 'blendee_admin',
      password: password,
      database: 'postgres',
      ssl: { rejectUnauthorized: false }
    });

    try {
      await pool.query('SELECT 1');
      console.log(`✅ SUCCESS! Password is: ${password}`);
      await pool.end();
      return;
    } catch (error) {
      console.log(`❌ Failed with password: ${password}`);
      await pool.end();
    }
  }
  console.log('\n⚠️  None of the passwords worked. Need to reset in AWS RDS.');
}

testPasswords();
