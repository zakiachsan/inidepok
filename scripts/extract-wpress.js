/**
 * WPress Extractor
 * Extracts files from .wpress backup format (All-in-One WP Migration)
 */

const fs = require('fs');
const path = require('path');

const HEADER_SIZE = 4377;

function extractWpress(wpressPath, outputDir) {
  console.log(`Extracting ${wpressPath} to ${outputDir}...`);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const buffer = fs.readFileSync(wpressPath);
  let offset = 0;
  let fileCount = 0;
  let errorCount = 0;

  while (offset + HEADER_SIZE < buffer.length) {
    try {
      // Read filename (first 255 bytes, null-padded)
      const filenameBytes = buffer.slice(offset, offset + 255);
      const filenameEnd = filenameBytes.indexOf(0);
      let filename = filenameBytes.slice(0, filenameEnd > 0 ? filenameEnd : 255).toString('utf8');

      // Clean filename
      filename = filename.replace(/\0/g, '').trim();

      if (!filename || filename.length === 0) {
        offset++;
        continue;
      }

      // Read file size (bytes 255-269, ASCII digits)
      const sizeBytes = buffer.slice(offset + 255, offset + 269);
      const sizeStr = sizeBytes.toString('utf8').replace(/\0/g, '').trim();
      const fileSize = parseInt(sizeStr, 10);

      if (isNaN(fileSize) || fileSize < 0 || fileSize > buffer.length) {
        offset++;
        continue;
      }

      // Read path (bytes 281-4377)
      const pathBytes = buffer.slice(offset + 281, offset + 4377);
      const pathEnd = pathBytes.indexOf(0);
      let filePath = pathBytes.slice(0, pathEnd > 0 ? Math.min(pathEnd, 500) : 0).toString('utf8');
      filePath = filePath.replace(/\0/g, '').trim();

      // Move to content
      offset += HEADER_SIZE;

      if (offset + fileSize > buffer.length) {
        console.log(`Warning: File ${filename} exceeds buffer, skipping...`);
        break;
      }

      // Read file content
      const content = buffer.slice(offset, offset + fileSize);
      offset += fileSize;

      // Skip files with invalid paths
      if (filePath.includes('\0') || filename.includes('\0')) {
        errorCount++;
        continue;
      }

      // Determine output path - only extract database.sql and important files
      let outputPath;

      // Priority: extract database.sql to root
      if (filename === 'database.sql') {
        outputPath = path.join(outputDir, 'database.sql');
      } else if (filename === 'package.json' && fileCount < 5) {
        outputPath = path.join(outputDir, 'wp-package.json');
      } else if (filePath && filePath.length > 0 && filePath.length < 200) {
        // Only extract wp-content/uploads for media files
        if (filePath.includes('wp-content/uploads')) {
          outputPath = path.join(outputDir, filePath, filename);
        } else {
          // Skip other WordPress files
          continue;
        }
      } else {
        continue;
      }

      // Create directory if needed
      const outputDirPath = path.dirname(outputPath);
      if (!fs.existsSync(outputDirPath)) {
        fs.mkdirSync(outputDirPath, { recursive: true });
      }

      // Write file
      fs.writeFileSync(outputPath, content);
      fileCount++;

      // Log progress
      if (filename === 'database.sql') {
        console.log(`*** FOUND database.sql (${fileSize} bytes) ***`);
      } else if (fileCount % 50 === 0) {
        console.log(`[${fileCount}] Extracted: ${filename} (${fileSize} bytes)`);
      }

    } catch (err) {
      errorCount++;
      offset++;
    }
  }

  console.log(`\nExtraction complete!`);
  console.log(`Files extracted: ${fileCount}`);
  console.log(`Errors/skipped: ${errorCount}`);
}

// Run extraction
const wpressFile = process.argv[2] || path.join(__dirname, '..', 'inidepok.com-20251120-141859-535.wpress');
const outputDir = process.argv[3] || path.join(__dirname, '..', 'wp-backup');

extractWpress(wpressFile, outputDir);
