const bcrypt = require('bcryptjs');

/**
 * Hashes a plain text string using bcrypt.
 * @param {string} plainText - The raw string to hash.
 * @param {number} [saltRounds=10] - Number of salt rounds.
 * @returns {Promise<string>} The generated bcrypt hash.
 */
async function hashPassword(plainText, saltRounds = 10) {
  return await bcrypt.hash(plainText, saltRounds);
}

/**
 * Compares a plain text string with a bcrypt hash.
 * @param {string} plainText - The raw string.
 * @param {string} hash - The stored bcrypt hash.
 * @returns {Promise<boolean>} Whether the string matches the hash.
 */
async function comparePassword(plainText, hash) {
  return await bcrypt.compare(plainText, hash);
}

// Allow CLI execution: node server/utils/hashHelper.js <password>
if (require.main === module) {
  const password = process.argv[2];

  if (!password) {
    console.error('Error: Please provide a plain text password argument to hash.');
    console.log('Usage: node server/utils/hashHelper.js <password>');
    process.exit(1);
  }

  hashPassword(password)
    .then((hash) => {
      console.log('--- Bcrypt Password Hash Generated ---');
      console.log(`Plain text: ${password}`);
      console.log(`Hash:       ${hash}`);
      console.log('\nCopy and paste this into server/.env:');
      console.log(`ADMIN_PASSWORD_HASH="${hash}"`);
    })
    .catch((err) => {
      console.error('Error hashing password:', err);
      process.exit(1);
    });
}

module.exports = {
  hashPassword,
  comparePassword,
};
