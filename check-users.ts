import postgres from 'postgres';

async function check() {
  const sql = postgres(process.env.DATABASE_URL!);
  const result = await sql`SELECT id, email, name FROM users`;
  console.log('Users:', result);
  await sql.end();
}

check();