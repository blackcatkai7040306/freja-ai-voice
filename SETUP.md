# Freja AI Voice Companion Setup

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
# Hume AI Configuration
# Get your API key from https://dev.hume.ai/

# Server-side API key (keep this secret)
HUME_API_KEY=your_hume_api_key_here

# Optional: Hume EVI Configuration ID
HUME_CONFIG_ID=your_config_id_here
```

## Getting Your Hume AI API Key

1. Visit [Hume AI Console](https://beta.hume.ai/sign-up)
2. Sign up for an account or log in
3. Navigate to API Keys section
4. Generate a new API key for your project
5. Copy the API key to your `.env.local` file

## Running the Application

1. Install dependencies:
```bash
npm install
```

2. Set up your environment variables (create `.env.local` file)

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Features

- **Voice Recording**: Click and hold to record voice messages
- **Real-time Processing**: Audio is processed through Hume AI for emotion analysis
- **Voice Responses**: AI responses include emotional context
- **Settings Panel**: Customize microphone, speaker, and volume settings
- **Conversation History**: View past messages with timestamps
- **Responsive Design**: Works on desktop and mobile devices

## Technical Architecture

- **Next.js 15**: React framework with App Router
- **TypeScript**: Type-safe development
- **TailwindCSS**: Utility-first styling
- **Hume AI**: Emotional AI voice processing
- **Web Audio API**: Browser-native audio recording

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Note: Requires HTTPS in production for microphone access.

## Customization

The app is designed with a dark theme and modern UI. You can customize:

- Colors in `tailwind.config.js`
- Voice settings in the settings panel
- Audio quality settings in `useVoiceChat` hook
- UI components in the `components` directory

## Troubleshooting

### Microphone Not Working
- Ensure browser has microphone permissions
- Check if HTTPS is enabled (required for production)
- Verify microphone is not muted or blocked

### API Errors
- Verify your Hume API key is correct
- Check API rate limits
- Ensure server is running properly

### Audio Playback Issues
- Check speaker/headphone connections
- Verify volume settings in the app
- Test with different browsers 