import postgres from 'postgres';
import bcrypt from 'bcryptjs';

const sql = postgres(process.env.DATABASE_URL!);

async function resetPassword() {
  const email = 'testuser@test.com';
  const newPassword = 'Test1234!';
  
  const hash = await bcrypt.hash(newPassword, 10);
  
  const result = await sql`
    UPDATE users 
    SET password_hash = ${hash} 
    WHERE email = ${email}
    RETURNING id, email
  `;
  
  console.log('Password reset for:', result);
  await sql.end();
}

resetPassword();