import { db } from './lib/db';

async function test() {
  try {
    const result = await db.execute('SELECT 1 as test');
    console.log('Success:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}

test();