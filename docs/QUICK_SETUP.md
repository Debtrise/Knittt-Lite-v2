# 🚀 Quick Setup Guide - ElevenLabs Audio Preview

## Get Audio Previews Working in 2 Minutes!

### Step 1: Get Your ElevenLabs API Key
1. Go to [ElevenLabs.io](https://elevenlabs.io)
2. Sign up or log in
3. Go to Settings → API Keys
4. Copy your API key

### Step 2: Add API Key to Your Project
1. Create a file called `.env.local` in your project root
2. Add this line:
```bash
ELEVEN_LABS_API_KEY=your_actual_api_key_here
```
3. Replace `your_actual_api_key_here` with your real API key

### Step 3: Restart Your Server
```bash
npm run dev
```

### Step 4: Test It Out!
1. Go to `/recordings`
2. Click "Create New Recording"
3. Write some text in the preview section
4. Select a voice
5. Click "Generate Preview"
6. 🎵 Listen to your audio!

## ✨ What You Get

- **Real Audio Previews**: Hear exactly how your text will sound
- **Voice Comparison**: Test multiple voices with the same text
- **Advanced Settings**: Control stability, similarity, style, and speaker boost
- **Voice Presets**: Quick settings for different use cases
- **Cost Tracking**: See character count and estimated costs

## 🔧 Troubleshooting

### "API key not configured" Error
- Make sure your `.env.local` file is in the project root
- Check that the API key is correct (starts with `sk-`)
- Restart your development server

### "Demo mode" Message
- This means the API key isn't detected
- Double-check your `.env.local` file
- Make sure there are no extra spaces around the API key

### Audio Not Playing
- Check browser console for errors
- Try a different browser
- Make sure you have an internet connection

## 💡 Pro Tips

1. **Start with Default Settings**: The default voice settings work great for most use cases
2. **Use Voice Presets**: Try "Audiobook" for narration or "Conversational" for dialogue
3. **Preview Before Saving**: Always test your audio before creating the recording
4. **Compare Voices**: Use the "Compare Voices" feature to find the perfect voice

## 🎯 Next Steps

Once you have previews working:
- Explore the Enhanced Preview Demo at `/recordings/enhanced-preview`
- Try the streaming test at `/recordings/test`
- Create your first recording and save it to the backend

## 📞 Need Help?

If you're still having issues:
1. Check the browser console for error messages
2. Verify your ElevenLabs account has credits
3. Make sure your API key has the right permissions 