const bcrypt = require('bcryptjs');

const password = 'admin123';
const hash = bcrypt.hashSync(password, 12);

console.log('Password:', password);
console.log('Hash:', hash);
console.log('Verification:', bcrypt.compareSync(password, hash));

// For copy-paste into SQL
console.log('\nFor database update:');
console.log(`VALUES ('System Admin', 'admin@usasya.com', '${hash}', '+1234567890', 'admin', 'active');`);
