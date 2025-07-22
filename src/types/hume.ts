/**
 * TypeScript interfaces for Hume AI integration
 * Defines types for voice interactions, emotions, and API responses
 */

export interface HumeConfig {
  apiKey: string;
  configId?: string;
  baseUrl?: string;
}

export interface AudioConfig {
  sampleRate: number;
  channels: number;
  encoding: string;
}

export interface EmotionScore {
  name: string;
  score: number;
}

export interface VoiceMessage {
  id: string;
  type: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  emotions?: EmotionScore[];
  duration?: number;
}

export interface ConversationState {
  messages: VoiceMessage[];
  isRecording: boolean;
  isProcessing: boolean;
  isPlaying: boolean;
  currentAudio?: HTMLAudioElement;
}

export interface HumeApiResponse {
  response: string;
  emotions: EmotionScore[];
  audioData: ArrayBuffer;
}

export interface AudioRecordingState {
  mediaRecorder: MediaRecorder | null;
  audioChunks: Blob[];
  stream: MediaStream | null;
}

export interface VoiceSettings {
  microphoneEnabled: boolean;
  speakerEnabled: boolean;
  volume: number;
  autoPlay: boolean;
  speechSpeed: number;
} 