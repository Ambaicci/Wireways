import { loginUser } from './lib/actions';

async function test() {
  // Replace the password below with the actual password for this account
  const result = await loginUser({
    email: 'testuser@test.com',
    password: 'Test1234!'  // Change this to the actual password
  });
  console.log('Login result:', result);
}

test();