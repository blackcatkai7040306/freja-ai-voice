import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ConversationState, 
  VoiceMessage, 
  VoiceSettings
} from '@/types/hume';

/**
 * Custom hook for managing voice chat functionality with Hume AI EVI
 * Uses WebSocket connection for real-time speech-to-speech interaction
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
    speechSpeed: 5, // 25% faster than normal
  });

  // Connection and audio state
  const [isConnected, setIsConnected] = useState(false);
  
  // Refs for managing audio and connection
  const socketRef = useRef<WebSocket | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  const audioQueueRef = useRef<Blob[]>([]);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef(false);

  /**
   * Send session settings to configure TTS speed and other options
   */
  const sendSessionSettings = useCallback(() => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const sessionSettings = {
        type: 'session_settings',
        tts: {
          voice: {
            provider: 'HUME_AI',
            speed: voiceSettings.speechSpeed, // Use dynamic speed from settings
          }
        },
        language_model: {
          temperature: 0.7,
        }
      };
      
      console.log('Sending session settings with speech speed:', voiceSettings.speechSpeed);
      socketRef.current.send(JSON.stringify(sessionSettings));
    }
  }, [voiceSettings.speechSpeed]);

  /**
   * Update speech speed and send new session settings
   */
  const updateSpeechSpeed = useCallback((newSpeed: number) => {
    setVoiceSettings(prev => ({
      ...prev,
      speechSpeed: newSpeed,
    }));
    
    // Send updated settings to Hume AI
    setTimeout(() => {
      sendSessionSettings();
    }, 100);
  }, [sendSessionSettings]);

  /**
   * Connect to Hume EVI WebSocket
   */
  const connect = useCallback(async () => {
    try {
      if (isConnected || socketRef.current) {
        console.log('Already connected or connecting');
        return;
      }

      console.log('Connecting to Hume EVI...');
      
      // Create WebSocket connection to Hume EVI with direct API key authentication
      const configId = 'b0cc7c5a-5f9f-4ec9-94ee-71bdaafd147c';
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY;
      
      if (!apiKey) {
        throw new Error('HUME_API_KEY not found in environment variables');
      }
      
      const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`;
      
      const socket = new WebSocket(wsUrl);
      socketRef.current = socket;

      socket.onopen = () => {
        console.log('Connected to Hume EVI successfully with config:', configId);
        setIsConnected(true);
        
        // Send session settings immediately after connection
        setTimeout(() => {
          sendSessionSettings();
        }, 100); // Small delay to ensure connection is fully established
      };

      // Handle incoming messages
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          console.log('Received message:', message.type);
          
          switch (message.type) {
            case 'session_settings':
              console.log('Session settings received and applied');
              break;
              
            case 'user_message':
              console.log('User message:', message.message?.content);
              if (!message.models?.prosody?.interim) {
                addUserMessage(message.message?.content || 'Voice message');
              }
              break;
              
            case 'assistant_message':
              console.log('Assistant message:', message.message?.content);
              addAssistantMessage(message.message?.content || '', message.models?.prosody?.scores || []);
              break;
              
            case 'audio_output':
              console.log('Received audio output');
              handleAudioOutput(message.data);
              break;
              
            case 'user_interruption':
              console.log('User interruption detected');
              stopAudioPlayback();
              break;
              
            case 'error':
              console.error('EVI Error:', message);
              addErrorMessage(`Error: ${message.message || 'Unknown error'}`);
              break;
              
            default:
              console.log('Unhandled message type:', message.type);
          }
        } catch (error) {
          console.error('Failed to parse message:', error);
        }
      };

      socket.onerror = (error) => {
        console.error('Socket error:', error);
        setIsConnected(false);
        addErrorMessage('Connection error occurred');
      };

      socket.onclose = () => {
        console.log('Socket connection closed');
        setIsConnected(false);
        cleanup();
      };
      
    } catch (error) {
      console.error('Failed to connect to Hume EVI:', error);
      setIsConnected(false);
      addErrorMessage(`Failed to connect: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [sendSessionSettings]);

  /**
   * Send audio input to EVI
   */
  const sendAudioInput = useCallback((base64Audio: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: 'audio_input',
        data: base64Audio,
      };
      socketRef.current.send(JSON.stringify(message));
    }
  }, []);

  /**
   * Start recording audio from user's microphone
   */
  const startRecording = useCallback(async () => {
    try {
      if (!isConnected || !socketRef.current) {
        throw new Error('Not connected to Hume EVI. Please connect first.');
      }

      if (!voiceSettings.microphoneEnabled) {
        throw new Error('Microphone is disabled');
      }

      console.log('Starting audio recording...');

      // Get user media with proper constraints for EVI
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioStreamRef.current = stream;

      // Create MediaRecorder with WebM format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
      });

      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            // Convert blob to base64 for transmission
            const arrayBuffer = await event.data.arrayBuffer();
            const base64Audio = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            
            // Send audio input to EVI
            sendAudioInput(base64Audio);
          } catch (error) {
            console.error('Failed to send audio data:', error);
          }
        }
      };

      mediaRecorder.onstop = () => {
        console.log('Recording stopped');
        setConversationState(prev => ({
          ...prev,
          isRecording: false,
        }));
      };

      mediaRecorder.start(100); // Send audio chunks every 100ms

      setConversationState(prev => ({
        ...prev,
        isRecording: true,
      }));

      console.log('Recording started successfully');
    } catch (error) {
      console.error('Failed to start recording:', error);
      addErrorMessage(`Failed to start recording: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw error;
    }
  }, [isConnected, voiceSettings.microphoneEnabled, sendAudioInput]);

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach(track => track.stop());
        audioStreamRef.current = null;
      }

      setConversationState(prev => ({
        ...prev,
        isRecording: false,
      }));

      console.log('Recording stopped successfully');
    } catch (error) {
      console.error('Failed to stop recording:', error);
    }
  }, []);

  /**
   * Handle incoming audio output from EVI
   */
  const handleAudioOutput = useCallback((base64Audio: string) => {
    try {
      if (!voiceSettings.speakerEnabled) return;

      // Convert base64 to blob
      const binaryString = atob(base64Audio);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: 'audio/wav' });

      // Add to audio queue
      audioQueueRef.current.push(audioBlob);

      // Start playing if not already playing
      if (!isPlayingRef.current) {
        playNextAudio();
      }
    } catch (error) {
      console.error('Failed to handle audio output:', error);
    }
  }, [voiceSettings.speakerEnabled]);

  /**
   * Play next audio in queue
   */
  const playNextAudio = useCallback(() => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) {
      return;
    }

    const audioBlob = audioQueueRef.current.shift();
    if (!audioBlob) return;

    isPlayingRef.current = true;
    setConversationState(prev => ({ ...prev, isPlaying: true }));

    const audioUrl = URL.createObjectURL(audioBlob);
    const audio = new Audio(audioUrl);
    audio.volume = voiceSettings.volume;
    currentAudioRef.current = audio;

    audio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setConversationState(prev => ({ ...prev, isPlaying: false }));
      currentAudioRef.current = null;

      // Play next audio in queue
      if (audioQueueRef.current.length > 0) {
        playNextAudio();
      }
    };

    audio.onerror = (error) => {
      console.error('Audio playback error:', error);
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setConversationState(prev => ({ ...prev, isPlaying: false }));
      currentAudioRef.current = null;
    };

    audio.play().catch(error => {
      console.error('Failed to play audio:', error);
      URL.revokeObjectURL(audioUrl);
      isPlayingRef.current = false;
      setConversationState(prev => ({ ...prev, isPlaying: false }));
      currentAudioRef.current = null;
    });
  }, [voiceSettings.volume]);

  /**
   * Stop audio playback and clear queue
   */
  const stopAudioPlayback = useCallback(() => {
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    
    isPlayingRef.current = false;
    audioQueueRef.current.length = 0; // Clear the queue
    
    setConversationState(prev => ({
      ...prev,
      isPlaying: false,
    }));
  }, []);

  /**
   * Add user message to conversation
   */
  const addUserMessage = useCallback((content: string) => {
    const message: VoiceMessage = {
      id: `user-${Date.now()}`,
      type: 'user',
      content,
      timestamp: new Date(),
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  /**
   * Add assistant message to conversation
   */
  const addAssistantMessage = useCallback((content: string, emotions: Array<{name: string, score: number}> = []) => {
    const message: VoiceMessage = {
      id: `assistant-${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
      emotions: emotions.map(emotion => ({
        name: emotion.name,
        score: emotion.score,
      })),
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  /**
   * Add error message to conversation
   */
  const addErrorMessage = useCallback((content: string) => {
    const message: VoiceMessage = {
      id: `error-${Date.now()}`,
      type: 'assistant',
      content,
      timestamp: new Date(),
    };

    setConversationState(prev => ({
      ...prev,
      messages: [...prev.messages, message],
    }));
  }, []);

  /**
   * Disconnect from EVI and cleanup
   */
  const disconnect = useCallback(() => {
    try {
      cleanup();
      setIsConnected(false);
      console.log('Disconnected from Hume EVI');
    } catch (error) {
      console.error('Error during disconnect:', error);
    }
  }, []);

  /**
   * Cleanup all resources
   */
  const cleanup = useCallback(() => {
    // Stop recording
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => track.stop());
      audioStreamRef.current = null;
    }

    // Stop audio playback
    stopAudioPlayback();

    // Close socket
    if (socketRef.current) {
      socketRef.current.close();
      socketRef.current = null;
    }

    setConversationState(prev => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
    }));
  }, [stopAudioPlayback]);

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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup();
    };
  }, [cleanup]);

  return {
    conversationState,
    voiceSettings,
    isConnected,
    connect,
    disconnect,
    startRecording,
    stopRecording,
    clearConversation,
    updateVoiceSettings,
    updateSpeechSpeed,
  };
}; 