const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

async function initDatabase() {
  const connectionString = process.env.DATABASE_URL;
  
  if (!connectionString) {
    console.error('❌ DATABASE_URL environment variable is not set');
    console.log('Please set DATABASE_URL in your .env.local file');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString,
    ssl: process.env.PGSSL === 'disable' ? false : { rejectUnauthorized: false }
  });

  try {
    console.log('🔗 Connecting to database...');
    const client = await pool.connect();
    
    console.log('📄 Reading schema file...');
    const schemaPath = path.join(__dirname, '..', 'db', 'schema.sql');
    const schema = fs.readFileSync(schemaPath, 'utf8');
    
    console.log('🚀 Running schema...');
    await client.query(schema);
    
    console.log('✅ Database initialized successfully!');
    
    client.release();
  } catch (error) {
    console.error('❌ Database initialization failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

initDatabase();
