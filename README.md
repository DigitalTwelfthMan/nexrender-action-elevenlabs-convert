# nexrender-action-elevenlabs-convert
Use elevenlabs to convert audio in nexrender



{
  "actions": {
    "predownload": [
      { 
        "module": "./path/to/nexrender-action-elevenlabs.js",
        "api_key": "YOUR_API_KEY",
        "voice_id": "pNInz6obpg8n9I4MG3JD",
        "model_id" : "eleven_multilingual_v2",
        "output_format": "mp3_44100_128",
        "layers": ["branded_slide.mp3", "music.mp3"]
      }
    ]
  },
  "assets": [
    {
      "src": "This text will be converted to audio by ElevenLabs.",
      "type": "audio",
      "name": "branded_slide.mp3",
      "layerName": "VoiceOver"
    }
  ]
}