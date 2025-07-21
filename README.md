# Freja AI Voice Companion

A modern voice AI companion app built with Next.js, TypeScript, and TailwindCSS, powered by Hume AI for emotional voice interactions.

## 🚀 Quick Start

1. **Clone and navigate to the project**
   ```bash
   cd freja-ai-voice
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env.local` file in the root directory:
   ```env
   HUME_API_KEY=your_hume_api_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Features

- **Voice Recording** - Click to record voice messages
- **AI Responses** - Get intelligent responses from Hume AI
- **Emotion Analysis** - See emotional context in AI responses
- **Settings Panel** - Customize audio preferences
- **Responsive Design** - Works on desktop and mobile
- **Dark Theme** - Modern dark UI with gradients

## 🎨 Styling with Custom CSS

The app uses custom utility-first CSS (similar to TailwindCSS) for all styling with:
- **Dark theme** as default
- **Gradient buttons** for interactive elements
- **Responsive design** for all screen sizes
- **Custom animations** for state changes
- **Clean typography** with Inter font

### Key UI Elements

- **Voice Button**: Large circular button with gradient background
- **Message Bubbles**: User messages in blue, AI messages in gray
- **Settings Panel**: Collapsible panel with audio controls
- **Loading States**: Animated spinners and progress indicators

## 🔧 Technical Stack

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe development
- **Custom CSS** - Utility-first styling system
- **Hume AI** - Emotional voice AI processing
- **Lucide Icons** - Clean, consistent icons

## 🎤 Browser Requirements

- **Chrome 88+**
- **Firefox 85+**
- **Safari 14+**
- **Edge 88+**

*Note: Microphone access requires HTTPS in production*

## 🔐 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `HUME_API_KEY` | Your Hume AI API key | Yes |
| `HUME_CONFIG_ID` | Hume AI configuration ID | Optional |

## 🛠️ Development

### Project Structure
```
src/
├── app/
│   ├── api/hume/voice/      # Hume AI API integration
│   ├── layout.tsx           # Root layout
│   ├── page.tsx            # Main page
│   └── globals.css         # Global styles
├── components/
│   ├── VoiceButton.tsx     # Recording button
│   └── VoiceChat.tsx       # Main chat interface
├── hooks/
│   └── useVoiceChat.ts     # Voice functionality
└── types/
    └── hume.ts             # TypeScript definitions
```

### Available Scripts

```bash
npm run dev      # Development server
npm run build    # Production build
npm run start    # Production server
npm run lint     # ESLint check
```

## 🎨 Customization

### Colors
Modify gradient colors in components:
- Primary: `from-blue-500 to-purple-600`
- Recording: `from-red-500 to-pink-600`
- Processing: `from-yellow-500 to-orange-600`

### Layout
All components use utility CSS classes for:
- Flexbox layouts
- Grid systems
- Responsive breakpoints
- Spacing and sizing

## 🐛 Troubleshooting

### Styling Issues
- Check `globals.css` for custom utility classes
- Verify PostCSS configuration
- Ensure all CSS classes are properly defined

### Microphone Access
- Allow microphone permissions in browser
- Use HTTPS in production
- Check browser compatibility

### API Issues
- Verify `HUME_API_KEY` in `.env.local`
- Check network connectivity
- Review browser console for errors

## 📄 License

This project is for demonstration purposes. Please ensure you have proper licensing for Hume AI usage.

---

Built with ❤️ using Next.js and custom CSS utilities
