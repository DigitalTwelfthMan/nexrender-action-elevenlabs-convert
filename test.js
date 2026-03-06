const action = require('./index.js');
const path = require('path');
const os = require('os');
const fs = require('fs');

// Minimal nexrender job/settings mocks
const workpath = fs.mkdtempSync(path.join(os.tmpdir(), 'elevenlabs-test-'));

const job = {
    workpath,
    assets: [
        {
            src: "Hello, this is a test of the ElevenLabs text to speech integration.",
            type: "audio",
            name: "test.mp3"
        }
    ]
};

const settings = {
    logger: { log: console.log }
};

const params = {
    api_key: process.env.ELEVENLABS_API_KEY,
    voice_id: process.env.ELEVENLABS_VOICE_ID || "uju3wxzG5OhpWcoi3SMy",
    layers: ["test.mp3"],
    model_id: "eleven_multilingual_v2",
    output_format: "mp3_44100_128"
};

console.log(`Working directory: ${workpath}\n`);

action(job, settings, params)
    .then(() => {
        const asset = job.assets[0];
        const filePath = asset.src.replace('file://', '');
        const stat = fs.statSync(filePath);

        console.log(`\nAsset src updated to: ${asset.src}`);
        console.log(`File size: ${(stat.size / 1024).toFixed(1)} KB`);
        console.log('\nTest passed.');
    })
    .catch(err => {
        console.error('\nTest failed:', err.message);
        process.exit(1);
    });
