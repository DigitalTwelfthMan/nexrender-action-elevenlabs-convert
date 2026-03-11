const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");
const fs = require("fs");
const { Readable } = require("stream");
const path = require("path");
const crypto = require("crypto");

module.exports = async (job, settings, { api_key, voice_id, layers, model_id, output_format }) => {
    if (!api_key) throw new Error("[elevenlabs] Missing required parameter: api_key");
    if (!voice_id) throw new Error("[elevenlabs] Missing required parameter: voice_id");
    if (!layers) throw new Error("[elevenlabs] Missing required parameter: layers");

    const client = new ElevenLabsClient({ apiKey: api_key });

    // Ensure layers is an array for easy iteration
    const targetLayers = Array.isArray(layers) ? layers : [layers];

    // Apply default before hashing and API call
    const resolvedFormat = output_format || "mp3_44100_128";

    for (const asset of job.assets) {
        // Only process audio assets that match the names in our 'layers' config
        if (asset.type === 'audio' && targetLayers.includes(asset.layerName)) {

            // Create a unique hash based on text, voice, and format to avoid duplicate API calls within a job
            const hash = crypto.createHash('md5')
                .update(asset.src + voice_id + resolvedFormat + (model_id || ''))
                .digest('hex');

            // Extract file extension from output_format (e.g., "mp3_44100_128" -> "mp3", "pcm_16000" -> "pcm")
            const fileExtension = resolvedFormat.split('_')[0];
            const fileName = `tts-${hash}.${fileExtension}`;
            const dest = path.join(job.workpath, fileName);

            if (fs.existsSync(dest)) {
                settings.logger.log(`[elevenlabs] Cache hit for "${asset.name}". Reusing existing file.`);
                asset.src = `file://${dest}`;
                continue;
            }

            try {
                settings.logger.log(`[elevenlabs] Calling API for: ${asset.name}`);

                const audioStream = await client.textToSpeech.stream(voice_id, {
                    text: asset.src,
                    modelId: model_id,
                    outputFormat: resolvedFormat,
                });

                // The SDK returns a Web ReadableStream; convert to a Node.js stream for piping
                const fileStream = fs.createWriteStream(dest);

                await new Promise((resolve, reject) => {
                    const nodeStream = Readable.fromWeb(audioStream);
                    nodeStream.on("error", reject);
                    nodeStream.pipe(fileStream);
                    fileStream.on("finish", resolve);
                    fileStream.on("error", reject);
                });

                // Update the asset src so nexrender uses the file instead of the string
                asset.src = `file://${dest}`;
                settings.logger.log(`[elevenlabs] Successfully saved to ${dest}`);

            } catch (error) {
                // We throw a hard error here to prevent nexrender from wasting time
                // trying to render a video with missing/broken audio assets.
                settings.logger.log(`[elevenlabs] API Error: ${error.message}`);
                throw new Error(`[elevenlabs] Failed to generate audio for ${asset.layerName}: ${error.message}`);
            }
        }
    }
};
