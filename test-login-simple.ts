import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const sql = postgres(process.env.DATABASE_URL!);

async function testLogin() {
  const email = 'testuser@test.com';
  const password = 'Test1234!'; // Change this to match the account

  const result = await sql`SELECT id, email, password_hash FROM users WHERE email = ${email}`;
  
  if (result.length === 0) {
    console.log('User not found');
    return;
  }

  const user = result[0];
  const isValid = await bcrypt.compare(password, user.password_hash);
  
  console.log('Login result:', {
    success: isValid,
    user: isValid ? { id: user.id, email: user.email } : null
  });

  await sql.end();
}

testLogin();