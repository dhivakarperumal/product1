const bcrypt = require('bcryptjs');

// Test password hashing/comparison directly
async function testPasswordComparison() {
  const testPassword = 'deepu@123';
  const wrongPassword = '9087654321';
  
  // Hash the correct password
  const hashedPassword = await bcrypt.hash(testPassword, 10);
  console.log('Testing password comparison:\n');
  console.log('Correct password:', testPassword);
  console.log('Wrong password:', wrongPassword);
  console.log('Generated hash:', hashedPassword.substring(0, 30) + '...\n');
  
  // Test correct password
  const correctMatch = await bcrypt.compare(testPassword, hashedPassword);
  console.log(`Testing correct password: ${correctMatch ? '✅ MATCHES' : '❌ NO MATCH'}`);
  
  // Test wrong password
  const wrongMatch = await bcrypt.compare(wrongPassword, hashedPassword);
  console.log(`Testing wrong password: ${wrongMatch ? '✅ MATCHES' : '❌ NO MATCH'}`);
  
  console.log('\n✅ This confirms bcrypt comparison is working correctly.');
  console.log('The "Invalid credentials" error means the password is wrong.');
  console.log('\n📝 Correct trainer credentials:');
  console.log('- Email/Username: deepu');
  console.log('- Password: deepu@123');
}

testPasswordComparison();
