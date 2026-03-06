# nexrender-action-elevenlabs-convert
Use ElevenLabs to convert text assets to audio in a nexrender job.

## Usage

Add this action to the `predownload` phase of your nexrender job. It will find any audio assets whose `name` matches an entry in `layers`, call the ElevenLabs API to synthesise speech from the asset's `src` text, and replace `src` with a local file path for the renderer to use.

```json
{
  "actions": {
    "predownload": [
      {
        "module": "nexrender-action-elevenlabs-convert",
        "api_key": "YOUR_API_KEY",
        "voice_id": "pNInz6obpg8n9I4MG3JD",
        "model_id": "eleven_multilingual_v2",
        "output_format": "mp3_44100_128",
        "layers": ["contact.mp3", "music.mp3"]
      }
    ]
  },
  "assets": [
    {
      "src": "This text will be converted to audio by ElevenLabs.",
      "type": "audio",
      "name": "contact.mp3",
      "layerName": "VoiceOver"
    },
    {
      "src": "I'm a song",
      "type": "audio",
      "name": "music.mp3",
      "layerName": "Music"
    }
  ]
}
```

## Testing

Run the included test script to verify the API connection and file output without a full render:

```bash
ELEVENLABS_API_KEY=your_key node test.js
```

To use a specific voice, pass `ELEVENLABS_VOICE_ID` as well:

```bash
ELEVENLABS_API_KEY=your_key ELEVENLABS_VOICE_ID=your_voice_id node test.js
```

A successful run will log the output file path and size. Running it a second time will log a cache hit, confirming no duplicate API call is made.

## Parameters

| Parameter | Required | Default | Description |
|---|---|---|---|
| `api_key` | Yes | — | Your ElevenLabs API key |
| `voice_id` | Yes | — | The ElevenLabs voice ID to use |
| `layers` | Yes | — | Asset name or array of names to process |
| `model_id` | No | API default | The ElevenLabs model ID (e.g. `eleven_multilingual_v2`) |
| `output_format` | No | `mp3_44100_128` | Output format string (e.g. `mp3_44100_128`, `pcm_16000`) |
