# Freja AI Voice Setup Guide

This guide will help you set up Freja AI Voice with Hume AI's Empathic Voice Interface (EVI).

## Prerequisites

- Node.js 18+ installed
- A Hume AI account with API access
- Vercel account (for deployment)

## Environment Variables Setup

### Required Environment Variables

You need to set up the following environment variables:

#### Server-side (for access token generation):
- `HUME_API_KEY` - Your Hume AI API key
- `HUME_SECRET_KEY` - Your Hume AI Secret key

#### Client-side (optional):
- `NEXT_PUBLIC_HUME_CONFIG_ID` - Your Hume EVI configuration ID (optional)

### Getting Your Hume AI Credentials

1. **Sign up/Login to Hume AI**:
   - Visit [Hume AI Portal](https://portal.hume.ai/)
   - Create an account or sign in

2. **Get API Keys**:
   - Navigate to the API Keys section
   - Copy your **API Key** and **Secret Key**

3. **Create EVI Configuration** (Optional):
   - Go to the EVI section in the portal
   - Create a new configuration
   - Copy the **Configuration ID**

### Setting Up Environment Variables

#### For Local Development

Create a `.env.local` file in your project root:

```bash
# Hume AI Credentials (Server-side)
HUME_API_KEY=your_hume_api_key_here
HUME_SECRET_KEY=your_hume_secret_key_here

# Hume EVI Configuration (Client-side, Optional)
NEXT_PUBLIC_HUME_CONFIG_ID=your_config_id_here
```

#### For Vercel Deployment

1. Go to your [Vercel Dashboard](https://vercel.com/dashboard)
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add the following variables:

| Name | Value | Environment |
|------|-------|-------------|
| `HUME_API_KEY` | Your Hume API key | Production, Preview, Development |
| `HUME_SECRET_KEY` | Your Hume Secret key | Production, Preview, Development |
| `NEXT_PUBLIC_HUME_CONFIG_ID` | Your EVI Config ID (optional) | Production, Preview, Development |

5. Click **Save** for each variable
6. Redeploy your application

#### Using Vercel CLI

Alternatively, you can use the Vercel CLI:

```bash
# Set the environment variables
vercel env add HUME_API_KEY
vercel env add HUME_SECRET_KEY
vercel env add NEXT_PUBLIC_HUME_CONFIG_ID

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

#### "Failed to fetch access token"
- **Cause**: Missing or incorrect `HUME_API_KEY` or `HUME_SECRET_KEY`
- **Solution**: Verify your environment variables are set correctly

#### "Connection error occurred"
- **Cause**: Network issues or invalid access token
- **Solution**: Check your internet connection and API credentials

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

- Never expose your `HUME_SECRET_KEY` in client-side code
- API keys are only used server-side for access token generation
- Access tokens have a limited lifespan (30 minutes)
- All voice data is processed securely through Hume AI

## Support

If you encounter issues:

1. Check the browser console for error messages
2. Verify all environment variables are set correctly
3. Ensure your Hume AI account has EVI access
4. Try refreshing the page and reconnecting

For additional help, refer to the [Hume AI Documentation](https://dev.hume.ai/docs/empathic-voice-interface-evi/overview). 