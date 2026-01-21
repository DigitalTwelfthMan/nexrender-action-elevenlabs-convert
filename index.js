const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

module.exports = async (job, settings, { api_key, voice_id, layers, model_id, output_format}, type) => {
    const client = new ElevenLabsClient({ apiKey: api_key });
    
    // Ensure layers is an array for easy iteration
    const targetLayers = Array.isArray(layers) ? layers : [layers];

    for (const asset of job.assets) {
        // Only process audio assets that match the names in our 'layers' config
        if (asset.type === 'audio' && targetLayers.includes(asset.name)) {
            
            // --- CONSIDERATION: CACHING ---
            // Create a unique hash based on text, voice, and format to avoid duplicate API costs
            const hash = crypto.createHash('md5')
                .update(asset.src + voice_id + output_format + model_id )
                .digest('hex');

            // Extract file extension from output_format (e.g., "mp3_44100_128" -> "mp3", "pcm_16000" -> "pcm")
            const fileExtension = output_format ? output_format.split('_')[0] : 'mp3';
            const fileName = `tts-${hash}.${fileExtension}`;
            const dest = path.join(job.workpath, fileName);

            if (fs.existsSync(dest)) {
                settings.logger.log(`[elevenlabs] Cache hit for "${asset.name}". Reusing existing file.`);
                asset.src = `file://${dest}`;
                continue;
            }

            try {
                settings.logger.log(`[elevenlabs] Calling API for: ${asset.name}`);

                // --- CONSIDERATION: FORMAT OPTIMIZATION ---
                const audioStream = await client.generate({
                    voice: voice_id,
                    text: asset.src,
                    model_id: model_id,
                    output_format: output_format
                });

                // Write the stream to the local workpath
                const fileStream = fs.createWriteStream(dest);

                await new Promise((resolve, reject) => {
                    audioStream.on("error", reject);
                    audioStream.pipe(fileStream);
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                });

                // Update the asset src so nexrender uses the file instead of the string
                asset.src = `file://${dest}`;
                settings.logger.log(`[elevenlabs] Successfully saved to ${dest}`);

            } catch (error) {
                // --- CONSIDERATION: ERROR HANDLING ---
                // We throw a hard error here to prevent nexrender from wasting time 
                // trying to render a video with missing/broken audio assets.
                settings.logger.log(`[elevenlabs] API Error: ${error.message}`);
                throw new Error(`[elevenlabs] Failed to generate audio for ${asset.name}: ${error.message}`);
            }
        }
    }
};