import { VoiceChat } from '@/components/VoiceChat';

/**
 * Main application page for Freja AI Voice Companion
 * Renders the complete voice chat interface
 */
export default function Home() {
  return (
    <main className="h-screen w-screen overflow-hidden">
      <VoiceChat />
    </main>
  );
}
