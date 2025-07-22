# Freja AI Voice Setup Guide

This guide will help you set up Freja AI Voice with Hume AI's Empathic Voice Interface (EVI).

## Prerequisites

- Node.js 18+ installed
- A Hume AI account with API access
- Vercel account (for deployment)

## Environment Variables Setup

### Required Environment Variables

You need to set up the following environment variable:

#### Client-side (Required):
- `NEXT_PUBLIC_HUME_API_KEY` - Your Hume AI API key

**Note**: The Hume EVI configuration is already set in the code (`b0cc7c5a-5f9f-4ec9-94ee-71bdaafd147c`) with pre-configured LLM model. We use direct API key authentication which simplifies the setup process.

### Getting Your Hume AI Credentials

1. **Sign up/Login to Hume AI**:
   - Visit [Hume AI Portal](https://portal.hume.ai/)
   - Create an account or sign in

2. **Get API Key**:
   - Navigate to the API Keys section
   - Copy your **API Key**

### Setting Up Environment Variables

#### For Local Development

Create a `.env.local` file in your project root:

```bash
# Hume AI API Key (Required)
NEXT_PUBLIC_HUME_API_KEY=your_hume_api_key_here
```

#### For Vercel Deployment

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variable:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_HUME_API_KEY` | Your Hume API key | Production, Preview, Development |

5. Click **Save**
6. Redeploy your application

#### Using Vercel CLI

Alternatively, you can use the Vercel CLI:

```bash
# Set the required environment variable
vercel env add NEXT_PUBLIC_HUME_API_KEY

# Follow the prompts to enter values and select environments

# Redeploy
vercel --prod
```

## Installation & Running

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see above)

3. **Run the development server**:
   ```bash
   npm run dev
   ```

4. **Open your browser**:
   - Navigate to `http://localhost:3000`
   - Click the connection button to connect to Hume EVI
   - Allow microphone permissions when prompted
   - Start your voice conversation!

### Production Deployment

1. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

2. **Set environment variables** in Vercel Dashboard (see above)

3. **Test your deployment**:
   - Visit your deployed URL
   - Test the voice functionality

## Usage

1. **Connect**: Click the WiFi icon in the header to connect to Hume EVI
2. **Settings**: Configure microphone, speaker, and volume settings
3. **Record**: Click and hold the microphone button to record your voice
4. **Listen**: The AI will respond with both text and voice

## Troubleshooting

### Common Issues

#### "HUME_API_KEY not found in environment variables"
- **Cause**: Missing or incorrect `NEXT_PUBLIC_HUME_API_KEY`
- **Solution**: Verify your environment variable is set correctly with the `NEXT_PUBLIC_` prefix

#### "Connection error occurred"
- **Cause**: Network issues or invalid API key
- **Solution**: Check your internet connection and verify your API key is correct

#### "Not connected to Hume EVI. Please connect first."
- **Cause**: Trying to record without establishing a connection
- **Solution**: Click the WiFi connection button before trying to record

#### "Microphone not working"
- **Cause**: Browser permissions or device issues
- **Solution**: 
  - Allow microphone permissions in your browser
  - Check if other applications are using the microphone
  - Try refreshing the page

#### "No audio playback"
- **Cause**: Speaker settings or browser audio issues
- **Solution**:
  - Check speaker settings in the app
  - Verify browser audio isn't muted
  - Try adjusting volume settings

### Debug Mode

To enable debug logging, open your browser's developer console (F12) to see detailed logs about:
- WebSocket connection status
- Audio processing
- API calls
- Error messages

## Features

- **Real-time voice conversation** with Hume AI EVI
- **Emotion detection** displayed with messages
- **Audio queue management** for smooth playback
- **Connection status** indicators
- **Voice settings** (microphone, speaker, volume)
- **Conversation history** with timestamps

## Security Notes

- The API key is used directly for WebSocket authentication
- Your specific Hume EVI configuration is pre-configured in the code
- All voice data is processed securely through Hume AI
- The `NEXT_PUBLIC_` prefix is required for client-side environment variables in Next.js

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure your Hume AI account has EVI access
4. Try refreshing the page and reconnecting

For additional help, refer to the [Hume AI Documentation](https://dev.hume.ai/docs/empathic-voice-interface-evi/overview). 