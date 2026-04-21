const sharp = require('sharp');
const path = require('path');

const src = 'C:/Users/harol/.gemini/antigravity/brain/1b070ef9-9b64-454b-bfa5-74c2a2637bdd/pichanga_icon_512_1776811749100.png';
const dest192 = path.join(__dirname, 'public/icon-192.png');
const dest512 = path.join(__dirname, 'public/icon-512.png');

async function run() {
  await sharp(src).resize(192, 192).toFile(dest192);
  console.log('Created icon-192.png');
  await sharp(src).resize(512, 512).toFile(dest512);
  console.log('Created icon-512.png');
}

run().catch(console.error);
