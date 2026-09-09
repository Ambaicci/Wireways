import postgres from 'postgres';

async function check() {
  const sql = postgres(process.env.DATABASE_URL!);
  const result = await sql`SELECT id, email, password_hash FROM users WHERE email = 'testuser@test.com'`;
  console.log('User:', result);
  await sql.end();
}

check();