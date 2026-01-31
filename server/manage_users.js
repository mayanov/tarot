
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { hashPassword } from './auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const CSV_PATH = path.join(__dirname, 'admin_users.csv');

const args = process.argv.slice(2);
const [email, password] = args;

if (!email || !password) {
    console.log('Usage: node server/manage_users.js <email> <password>');
    process.exit(1);
}

// Read existing users to check for duplicates (optional, simplified for now)
let lines = [];
if (fs.existsSync(CSV_PATH)) {
    const data = fs.readFileSync(CSV_PATH, 'utf8');
    lines = data.split('\n').filter(line => line.trim() !== '');
} else {
    lines.push('email,password_hash'); // Header
}

// Remove the user if they already exist (update password)
const newLines = lines.filter(line => !line.startsWith(`${email},`));

// Hash
const storedValue = hashPassword(password);
newLines.push(`${email},${storedValue}`);

// Write back
fs.writeFileSync(CSV_PATH, newLines.join('\n'));
console.log(`User ${email} updated/added successfully.`);
