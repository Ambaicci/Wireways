import postgres from 'postgres';

const sql = postgres(process.env.DATABASE_URL!);

async function check() {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`;
  console.log('Tables:', tables.map(t => t.table_name));
  
  const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='users'`;
  console.log('\nUsers table columns:', cols);
  
  await sql.end();
}

check();