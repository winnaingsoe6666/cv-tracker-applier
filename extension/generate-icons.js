/**
 * generate-icons.js
 * Run once with: node generate-icons.js
 * Requires: npm install sharp  (or use any image tool)
 *
 * Resizes icon-128.png down to 48px and 16px.
 * If sharp is not available, you can manually resize icon-128.png
 * using any image editor or online tool.
 */
const path = require("path");

async function main() {
  let sharp;
  try {
    sharp = require("sharp");
  } catch {
    console.log("sharp not installed. Run: npm install sharp");
    console.log("Then manually resize icons/icon-128.png to 48x48 (icon-48.png) and 16x16 (icon-16.png)");
    return;
  }
  const src = path.join(__dirname, "icons", "icon-128.png");
  await sharp(src).resize(48, 48).png().toFile(path.join(__dirname, "icons", "icon-48.png"));
  await sharp(src).resize(16, 16).png().toFile(path.join(__dirname, "icons", "icon-16.png"));
  console.log("✓ Generated icon-48.png and icon-16.png");
}

main().catch(console.error);
