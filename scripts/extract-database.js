/**
 * Extract database.sql from wpress file
 */

const fs = require('fs');
const path = require('path');

const HEADER_SIZE = 4377;
const DB_OFFSET = 100722199; // Found via grep

const wpressFile = path.join(__dirname, '..', 'inidepok.com-20251120-141859-535.wpress');
const outputDir = path.join(__dirname, '..', 'wp-backup');

console.log('Extracting database.sql...');

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const fd = fs.openSync(wpressFile, 'r');
const headerBuffer = Buffer.alloc(HEADER_SIZE);

// Read header starting from the database.sql entry
fs.readSync(fd, headerBuffer, 0, HEADER_SIZE, DB_OFFSET);

// Parse filename
const filename = headerBuffer.slice(0, 255).toString('utf8').replace(/\0/g, '').trim();
console.log('Filename:', filename);

// Parse file size
const sizeStr = headerBuffer.slice(255, 269).toString('utf8').replace(/\0/g, '').trim();
const fileSize = parseInt(sizeStr, 10);
console.log('File size:', fileSize, 'bytes');

// Extract content
const contentBuffer = Buffer.alloc(fileSize);
fs.readSync(fd, contentBuffer, 0, fileSize, DB_OFFSET + HEADER_SIZE);

// Write to file
const outputPath = path.join(outputDir, 'database.sql');
fs.writeFileSync(outputPath, contentBuffer);

fs.closeSync(fd);

console.log(`Extracted to: ${outputPath}`);

// Verify
const stats = fs.statSync(outputPath);
console.log('Output file size:', stats.size, 'bytes');

// Show first few lines
const content = fs.readFileSync(outputPath, 'utf8');
console.log('\nFirst 500 chars:\n', content.slice(0, 500));
