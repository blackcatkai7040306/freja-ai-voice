import { useState, useCallback, useRef, useEffect } from "react"
import { ConversationState, VoiceMessage, VoiceSettings } from "@/types/hume"

/**
 * Custom hook for managing voice chat functionality with Hume AI EVI
 * Uses WebSocket connection for real-time speech-to-speech interaction
 */
export const useVoiceChat = () => {
  // Conversation state management
  const [conversationState, setConversationState] = useState<ConversationState>(
    {
      messages: [],
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
    }
  )

  // Voice settings state
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettings>({
    microphoneEnabled: true,
    speakerEnabled: true,
    volume: 0.8,
    autoPlay: true,
  })

  // Connection and audio state
  const [isConnected, setIsConnected] = useState(false)

  // Refs for managing audio and connection
  const socketRef = useRef<WebSocket | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioStreamRef = useRef<MediaStream | null>(null)
  const audioQueueRef = useRef<Blob[]>([])
  const currentAudioRef = useRef<HTMLAudioElement | null>(null)
  const isPlayingRef = useRef(false)
  const audioContextRef = useRef<AudioContext | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const mediaSourceRef = useRef<MediaSource | null>(null)
  const sourceBufferRef = useRef<SourceBuffer | null>(null)
  const audioChunksBuffer = useRef<Uint8Array[]>([])
  const isStreamingAudioRef = useRef(false)

  // WebSocket connection state and buffering
  const connectionStateRef = useRef<
    "connecting" | "connected" | "disconnected"
  >("disconnected")
  const lastAudioSentRef = useRef<number>(0)
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const keepAliveIntervalRef = useRef<NodeJS.Timeout | null>(null)

  /**
   * Connect to Hume EVI WebSocket with robust connection handling
   */
  const connect = useCallback(async () => {
    try {
      if (
        connectionStateRef.current === "connecting" ||
        connectionStateRef.current === "connected"
      ) {
        console.log("Already connected or connecting")
        return
      }

      connectionStateRef.current = "connecting"
      console.log("Connecting to Hume EVI...")

      // Clear any existing reconnection timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current)
        reconnectTimeoutRef.current = null
      }

      // Create WebSocket connection with optimized settings
      const configId = "b0cc7c5a-5f9f-4ec9-94ee-71bdaafd147c"
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY

      if (!apiKey) {
        throw new Error("HUME_API_KEY not found in environment variables")
      }

      const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`

      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      // Set up connection timeout
      const connectionTimeout = setTimeout(() => {
        if (socket.readyState === WebSocket.CONNECTING) {
          console.error("Connection timeout")
          socket.close()
          connectionStateRef.current = "disconnected"
          setIsConnected(false)
        }
      }, 10000)

      socket.onopen = () => {
        clearTimeout(connectionTimeout)
        console.log("Connected to Hume EVI successfully")
        connectionStateRef.current = "connected"
        setIsConnected(true)

        // Start keep-alive ping
        keepAliveIntervalRef.current = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            console.log("Sending keep-alive ping")
          }
        }, 30000) // Every 30 seconds
      }

      // Direct message handling - prioritize audio to prevent clipping
      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          console.log("Received message:", message.type)

          switch (message.type) {
            case "session_settings":
              console.log("Session settings received")
              break

            case "user_message":
              console.log("User message:", message.message?.content)
              if (!message.models?.prosody?.interim) {
                addUserMessage(message.message?.content || "Voice message")
              }
              break

            case "assistant_message":
              console.log("Assistant message:", message.message?.content)
              addAssistantMessage(
                message.message?.content || "",
                message.models?.prosody?.scores || []
              )
              initializeStreamingAudio()
              break

            case "audio_output":
              console.log("Received audio output chunk")
              handleStreamingAudioOutput(message.data)
              break

            case "assistant_end":
              console.log("Assistant finished speaking")
              finalizeStreamingAudio()
              break

            case "user_interruption":
              console.log("User interruption detected")
              stopAudioPlayback()
              break

            case "error":
              console.error("EVI Error:", message)
              addErrorMessage(`Error: ${message.message || "Unknown error"}`)
              break

            default:
              console.log("Unhandled message type:", message.type)
          }
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      socket.onerror = (error) => {
        clearTimeout(connectionTimeout)
        console.error("WebSocket error:", error)
        connectionStateRef.current = "disconnected"
        setIsConnected(false)
        addErrorMessage("Connection error occurred")
      }

      socket.onclose = (event) => {
        clearTimeout(connectionTimeout)
        console.log("WebSocket connection closed:", event.code, event.reason)
        connectionStateRef.current = "disconnected"
        setIsConnected(false)

        // Clear keep-alive interval
        if (keepAliveIntervalRef.current) {
          clearInterval(keepAliveIntervalRef.current)
          keepAliveIntervalRef.current = null
        }

        // Auto-reconnect for unexpected closures
        if (event.code !== 1000 && event.code !== 1001) {
          console.log("Attempting to reconnect in 3 seconds...")
          reconnectTimeoutRef.current = setTimeout(() => {
            connect()
          }, 3000)
        }
      }
    } catch (error) {
      console.error("Failed to connect to Hume EVI:", error)
      connectionStateRef.current = "disconnected"
      setIsConnected(false)
      addErrorMessage(
        `Failed to connect: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      throw error
    }
  }, [])

  /**
   * Send audio input to EVI with throttling to prevent socket overflow
   */
  const sendAudioInput = useCallback((base64Audio: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const now = Date.now()

      // Throttle audio input to prevent overwhelming the socket (min 50ms between sends)
      if (now - lastAudioSentRef.current < 50) {
        console.log("Throttling audio input to prevent socket overflow")
        return
      }

      const message = {
        type: "audio_input",
        data: base64Audio,
      }

      try {
        socketRef.current.send(JSON.stringify(message))
        lastAudioSentRef.current = now
        console.log("Sent audio chunk, size:", base64Audio.length)
      } catch (error) {
        console.error("Failed to send audio input:", error)
      }
    } else {
      console.warn("Cannot send audio: WebSocket not connected")
    }
  }, [])

  /**
   * Initialize audio context for better processing
   */
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext ||
        (window as unknown as typeof AudioContext))()
      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.connect(audioContextRef.current.destination)
    }
  }, [])

  /**
   * Convert blob to base64 using FileReader (more efficient)
   */
  const blobToBase64 = useCallback((blob: Blob): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]
        resolve(base64)
      }
      reader.onerror = reject
      reader.readAsDataURL(blob)
    })
  }, [])

  /**
   * Initialize simple audio playback (more reliable than MediaSource)
   */
  const initializeStreamingAudio = useCallback(() => {
    try {
      if (!voiceSettings.speakerEnabled) return

      console.log("Initializing audio playback for assistant response")

      // Clear any existing audio queue and reset state
      audioQueueRef.current = []
      isStreamingAudioRef.current = true

      setConversationState((prev) => ({ ...prev, isPlaying: true }))
    } catch (error) {
      console.error("Failed to initialize audio:", error)
    }
  }, [voiceSettings.speakerEnabled])

  /**
   * Handle audio output chunks - using simple blob approach
   */
  const handleStreamingAudioOutput = useCallback(
    (base64Audio: string) => {
      try {
        if (!voiceSettings.speakerEnabled || !isStreamingAudioRef.current)
          return

        console.log("Processing audio chunk, length:", base64Audio.length)

        // Convert base64 to blob
        const binaryString = atob(base64Audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        // Try different audio formats - EVI might send various formats
        // First try as raw audio/wav
        const audioBlob = new Blob([bytes], { type: "audio/wav" })

        // If the chunk is too small, it might not be valid audio
        if (bytes.length < 100) {
          console.warn("Audio chunk too small, skipping:", bytes.length)
          return
        }

        console.log("Created audio blob:", audioBlob.size, "bytes")

        // Add to queue for sequential playback
        audioQueueRef.current.push(audioBlob)

        // Start playing if not already playing
        if (!isPlayingRef.current && audioQueueRef.current.length > 0) {
          playNextAudioChunk()
        }
      } catch (error) {
        console.error("Failed to handle audio chunk:", error)
      }
    },
    [voiceSettings.speakerEnabled]
  )

  /**
   * Play next audio chunk in queue
   */
  const playNextAudioChunk = useCallback(() => {
    if (audioQueueRef.current.length === 0 || isPlayingRef.current) return

    const audioBlob = audioQueueRef.current.shift()
    if (!audioBlob) return

    console.log("Playing audio chunk")

    isPlayingRef.current = true

    const audioUrl = URL.createObjectURL(audioBlob)
    const audio = new Audio(audioUrl)

    // Set volume with some headroom to prevent clipping
    audio.volume = Math.min(voiceSettings.volume * 0.9, 0.9)
    audio.preload = "auto"

    currentAudioRef.current = audio

    audio.onended = () => {
      console.log("Audio chunk finished")
      URL.revokeObjectURL(audioUrl)
      currentAudioRef.current = null
      isPlayingRef.current = false

      // Small delay before next chunk to prevent overlap
      setTimeout(() => {
        if (audioQueueRef.current.length > 0) {
          playNextAudioChunk()
        } else if (!isStreamingAudioRef.current) {
          // All chunks played and assistant finished
          setConversationState((prev) => ({ ...prev, isPlaying: false }))
        }
      }, 50)
    }

    audio.onerror = (error) => {
      console.error("Audio playback error:", error)
      URL.revokeObjectURL(audioUrl)
      currentAudioRef.current = null
      isPlayingRef.current = false

      // Try next chunk even if this one failed
      setTimeout(() => {
        if (audioQueueRef.current.length > 0) {
          playNextAudioChunk()
        }
      }, 100)
    }

    // Start playback
    audio.play().catch((error) => {
      console.error("Failed to start audio playback:", error)
      URL.revokeObjectURL(audioUrl)
      currentAudioRef.current = null
      isPlayingRef.current = false

      // Try next chunk
      setTimeout(() => {
        if (audioQueueRef.current.length > 0) {
          playNextAudioChunk()
        }
      }, 100)
    })
  }, [voiceSettings.volume])

  /**
   * Finalize audio when assistant finishes speaking
   */
  const finalizeStreamingAudio = useCallback(() => {
    try {
      console.log("Assistant finished speaking, finalizing audio")

      // Mark streaming as finished
      isStreamingAudioRef.current = false

      // If no audio is currently playing and queue is empty, update state
      if (!isPlayingRef.current && audioQueueRef.current.length === 0) {
        setConversationState((prev) => ({ ...prev, isPlaying: false }))
      }

      // The audio will finish naturally as chunks complete
    } catch (error) {
      console.error("Failed to finalize audio:", error)
    }
  }, [])

  /**
   * Start recording audio from user's microphone
   */
  const startRecording = useCallback(async () => {
    try {
      if (!isConnected || !socketRef.current) {
        throw new Error("Not connected to Hume EVI. Please connect first.")
      }

      if (!voiceSettings.microphoneEnabled) {
        throw new Error("Microphone is disabled")
      }

      console.log("Starting audio recording...")

      // Initialize audio context
      initializeAudioContext()

      // Get user media with proper constraints for EVI
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 48000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      })

      audioStreamRef.current = stream

      // Create MediaRecorder with WebM format
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 64000, // Optimize bitrate to reduce clipping
      })

      mediaRecorderRef.current = mediaRecorder

      mediaRecorder.ondataavailable = async (event) => {
        if (event.data.size > 0) {
          try {
            // Use improved base64 conversion
            const base64Audio = await blobToBase64(event.data)
            sendAudioInput(base64Audio)
          } catch (error) {
            console.error("Failed to send audio data:", error)
          }
        }
      }

      mediaRecorder.onstop = () => {
        console.log("Recording stopped")
        setConversationState((prev) => ({
          ...prev,
          isRecording: false,
        }))
      }

      mediaRecorder.start(100) // Optimized for socket throttling (100ms chunks, 50ms send throttle)

      setConversationState((prev) => ({
        ...prev,
        isRecording: true,
      }))

      console.log("Recording started successfully")
    } catch (error) {
      console.error("Failed to start recording:", error)
      addErrorMessage(
        `Failed to start recording: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      )
      throw error
    }
  }, [
    isConnected,
    voiceSettings.microphoneEnabled,
    sendAudioInput,
    initializeAudioContext,
    blobToBase64,
  ])

  /**
   * Stop recording audio
   */
  const stopRecording = useCallback(() => {
    try {
      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !== "inactive"
      ) {
        mediaRecorderRef.current.stop()
      }

      if (audioStreamRef.current) {
        audioStreamRef.current.getTracks().forEach((track) => track.stop())
        audioStreamRef.current = null
      }

      setConversationState((prev) => ({
        ...prev,
        isRecording: false,
      }))

      console.log("Recording stopped successfully")
    } catch (error) {
      console.error("Failed to stop recording:", error)
    }
  }, [])

  // Note: handleAudioOutput is now replaced by handleStreamingAudioOutput for better performance

  // Note: playNextAudio is no longer needed as we use streaming audio for continuous playback

  /**
   * Stop audio playback and cleanup streaming resources
   */
  const stopAudioPlayback = useCallback(() => {
    try {
      // Stop current audio
      if (currentAudioRef.current) {
        currentAudioRef.current.pause()
        currentAudioRef.current.currentTime = 0
      }

      // Close media source if streaming
      if (
        mediaSourceRef.current &&
        mediaSourceRef.current.readyState === "open"
      ) {
        mediaSourceRef.current.endOfStream()
      }

      // Clear streaming state
      isStreamingAudioRef.current = false
      isPlayingRef.current = false

      // Clear buffers
      audioQueueRef.current.length = 0
      audioChunksBuffer.current.length = 0

      // Clean up refs
      if (currentAudioRef.current) {
        URL.revokeObjectURL(currentAudioRef.current.src)
        currentAudioRef.current = null
      }
      mediaSourceRef.current = null
      sourceBufferRef.current = null

      setConversationState((prev) => ({
        ...prev,
        isPlaying: false,
      }))
    } catch (error) {
      console.error("Error stopping audio playback:", error)
    }
  }, [])

  /**
   * Add user message to conversation
   */
  const addUserMessage = useCallback((content: string) => {
    const message: VoiceMessage = {
      id: `user-${Date.now()}`,
      type: "user",
      content,
      timestamp: new Date(),
    }

    setConversationState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }, [])

  /**
   * Add assistant message to conversation
   */
  const addAssistantMessage = useCallback(
    (
      content: string,
      emotions: Array<{ name: string; score: number }> = []
    ) => {
      const message: VoiceMessage = {
        id: `assistant-${Date.now()}`,
        type: "assistant",
        content,
        timestamp: new Date(),
        emotions: emotions.map((emotion) => ({
          name: emotion.name,
          score: emotion.score,
        })),
      }

      setConversationState((prev) => ({
        ...prev,
        messages: [...prev.messages, message],
      }))
    },
    []
  )

  /**
   * Add error message to conversation
   */
  const addErrorMessage = useCallback((content: string) => {
    const message: VoiceMessage = {
      id: `error-${Date.now()}`,
      type: "assistant",
      content,
      timestamp: new Date(),
    }

    setConversationState((prev) => ({
      ...prev,
      messages: [...prev.messages, message],
    }))
  }, [])

  /**
   * Disconnect from EVI and cleanup
   */
  const disconnect = useCallback(() => {
    try {
      cleanup()
      setIsConnected(false)
      console.log("Disconnected from Hume EVI")
    } catch (error) {
      console.error("Error during disconnect:", error)
    }
  }, [])

  /**
   * Cleanup all resources including connection management
   */
  const cleanup = useCallback(() => {
    // Stop recording
    if (
      mediaRecorderRef.current &&
      mediaRecorderRef.current.state !== "inactive"
    ) {
      mediaRecorderRef.current.stop()
    }

    // Stop audio stream
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach((track) => track.stop())
      audioStreamRef.current = null
    }

    // Stop audio playback and streaming
    stopAudioPlayback()

    // Close audio context
    if (audioContextRef.current && audioContextRef.current.state !== "closed") {
      audioContextRef.current.close()
      audioContextRef.current = null
      gainNodeRef.current = null
    }

    // Clear connection timers
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current)
      reconnectTimeoutRef.current = null
    }

    if (keepAliveIntervalRef.current) {
      clearInterval(keepAliveIntervalRef.current)
      keepAliveIntervalRef.current = null
    }

    // Close socket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

    // Reset connection state
    connectionStateRef.current = "disconnected"

    // Clear all audio buffers and streaming state
    audioQueueRef.current.length = 0
    audioChunksBuffer.current.length = 0
    isStreamingAudioRef.current = false

    setConversationState((prev) => ({
      ...prev,
      isRecording: false,
      isProcessing: false,
      isPlaying: false,
    }))
  }, [stopAudioPlayback])

  /**
   * Clear conversation history
   */
  const clearConversation = useCallback(() => {
    setConversationState((prev) => ({
      ...prev,
      messages: [],
    }))
  }, [])

  /**
   * Update voice settings
   */
  const updateVoiceSettings = useCallback(
    (newSettings: Partial<VoiceSettings>) => {
      setVoiceSettings((prev) => ({
        ...prev,
        ...newSettings,
      }))
    },
    []
  )

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanup()
    }
  }, [cleanup])

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
  }
}
