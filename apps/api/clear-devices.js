/**
 * Quick script to clear all devices for a user
 * Usage: node clear-devices.js <email>
 * Example: node clear-devices.js primexa1967@gmail.com
 */

const fs = require('fs');
const path = require('path');

const usersFile = path.join(__dirname, 'storage', 'users.json');

function clearDevices(email) {
  try {
    // Read users
    const users = JSON.parse(fs.readFileSync(usersFile, 'utf-8'));
    
    // Find user
    const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (!user) {
      console.error(`❌ User not found: ${email}`);
      return;
    }
    
    // Clear devices
    user.devices = [];
    
    // Save
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2), 'utf-8');
    
    console.log(`✅ Cleared all devices for ${user.name} (${user.email})`);
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node clear-devices.js <email>');
  console.log('Example: node clear-devices.js primexa1967@gmail.com');
  process.exit(1);
}

clearDevices(email);
