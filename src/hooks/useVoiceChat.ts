import { useState, useCallback, useRef, useEffect } from 'react';
import { HumeClient } from 'hume';
import { 
  ConversationState, 
  VoiceMessage, 
  AudioRecordingState,
  VoiceSettings,
  HumeApiResponse 
} from '@/types/hume';

/**
 * Custom hook for managing voice chat functionality with Hume AI
 * Handles audio recording, playback, and real-time conversation processing
 */
export const useVoiceChat = () => {
  // Conversation state management
  const [conversationState, setConversationState] = useState<ConversationState>({
    messages: [],
    isRecording: false,
    isProcessing: false,
    isPlaying: false,
  });

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    microphoneEnabled: true,
    speakerEnabled: true,
    volume: 0.8,
    autoPlay: true,
  });

  // Audio recording state
  const [recordingState, setRecordingState] = useState<AudioRecordingState>({
    mediaRecorder: null,
    audioChunks: [],
    stream: null,
  });

  // Refs for managing audio and Hume client
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const humeClientRef = useRef<HumeClient | null>(null);

  /**
   * Initialize Hume AI client with API key
   */
  const initializeHume = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_HUME_API_KEY) {
        throw new Error('Hume API key not found in environment variables');
      }

      humeClientRef.current = new HumeClient({
        apiKey: process.env.NEXT_PUBLIC_HUME_API_KEY,
      });

      console.log('Hume client initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Hume client:', error);
      throw error;
    }
  }, []);

  /**
   * Start recording audio from user's microphone
   */
  const startRecording = useCallback(async () => {
    try {
      if (!voiceSettings.microphoneEnabled) {
        throw new Error('Microphone is disabled');
      }

      // Get user media (microphone access)
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
        },
      });

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      const audioChunks: Blob[] = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunks.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        await processAudioMessage(audioBlob);
      };

      mediaRecorder.start();

      setRecordingState({
        mediaRecorder,
        audioChunks,
        stream,
      });

      setConversationState(prev => ({
        ...prev,
        isRecording: true,
      }));

      console.log('Recording started');
    } catch (error) {
      console.error('Failed to start recording:', error);
      throw error;
    }
  }, [voiceSettings.microphoneEnabled]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    try {
      if (recordingState.mediaRecorder && recordingState.mediaRecorder.state !== 'inactive') {
        recordingState.mediaRecorder.stop();
      }

      if (recordingState.stream) {
        recordingState.stream.getTracks().forEach(track => track.stop());
      }

      setRecordingState({
        mediaRecorder: null,
        audioChunks: [],
        stream: null,
      });

      setConversationState(prev => ({
        ...prev,
        isRecording: false,
        isProcessing: true,
      }));

      console.log('Recording stopped');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, [recordingState]);

  /**
   * Process audio message through Hume AI API
   */
  const processAudioMessage = useCallback(async (audioBlob: Blob) => {
    try {
      if (!humeClientRef.current) {
        await initializeHume();
      }

      setConversationState(prev => ({
        ...prev,
        isProcessing: true,
      }));

      // Convert blob to ArrayBuffer for API
      const arrayBuffer = await audioBlob.arrayBuffer();
      
      // Create FormData for multipart upload
      const formData = new FormData();
      formData.append('audio', audioBlob, 'recording.webm');

      // Call Hume API through Next.js API route
      const response = await fetch('/api/hume/voice', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.statusText}`);
      }

      const result: HumeApiResponse = await response.json();

      // Add user message to conversation
      const userMessage: VoiceMessage = {
        id: `user-${Date.now()}`,
        type: 'user',
        content: 'Voice message',
        timestamp: new Date(),
        audioUrl: URL.createObjectURL(audioBlob),
      };

      // Add assistant response to conversation
      const assistantMessage: VoiceMessage = {
        id: `assistant-${Date.now()}`,
        type: 'assistant',
        content: result.response,
        timestamp: new Date(),
        emotions: result.emotions,
      };

      setConversationState(prev => ({
        ...prev,
        messages: [...prev.messages, userMessage, assistantMessage],
        isProcessing: false,
      }));

      // Auto-play response if enabled
      if (voiceSettings.autoPlay && voiceSettings.speakerEnabled) {
        await playAudioResponse(result.audioData);
      }

    } catch (error) {
      console.error('Failed to process audio message:', error);
      setConversationState(prev => ({
        ...prev,
        isProcessing: false,
      }));
      throw error;
    }
  }, [initializeHume, voiceSettings]);

  /**
   * Play audio response from Hume AI
   */
  const playAudioResponse = useCallback(async (audioData: ArrayBuffer) => {
    try {
      if (!voiceSettings.speakerEnabled) return;

      const audioBlob = new Blob([audioData], { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);

      const audio = new Audio(audioUrl);
      audio.volume = voiceSettings.volume;

      audioRef.current = audio;

      setConversationState(prev => ({
        ...prev,
        isPlaying: true,
        currentAudio: audio,
      }));

      audio.onended = () => {
        setConversationState(prev => ({
          ...prev,
          isPlaying: false,
          currentAudio: undefined,
        }));
        URL.revokeObjectURL(audioUrl);
      };

      await audio.play();
    } catch (error) {
      console.error('Failed to play audio response:', error);
      setConversationState(prev => ({
        ...prev,
        isPlaying: false,
        currentAudio: undefined,
      }));
    }
  }, [voiceSettings]);

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setConversationState(prev => ({
      ...prev,
      messages: [],
    }));
  }, []);

  /**
   * Update voice settings
   */
  const updateVoiceSettings = useCallback((newSettings: Partial<VoiceSettings>) => {
    setVoiceSettings(prev => ({
      ...prev,
      ...newSettings,
    }));
  }, []);

  // Initialize Hume client on mount
  useEffect(() => {
    initializeHume().catch(error => {
      console.error('Failed to initialize Hume on mount:', error);
    });
  }, [initializeHume]);

  return {
    conversationState,
    voiceSettings,
    startRecording,
    stopRecording,
    clearConversation,
    updateVoiceSettings,
    playAudioResponse,
  };
}; 