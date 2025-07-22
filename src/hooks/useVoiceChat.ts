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

  /**
   * Connect to Hume EVI WebSocket
   */
  const connect = useCallback(async () => {
    try {
      if (isConnected || socketRef.current) {
        console.log("Already connected or connecting")
        return
      }

      console.log("Connecting to Hume EVI...")

      // Create WebSocket connection to Hume EVI with direct API key authentication
      const configId = "b0cc7c5a-5f9f-4ec9-94ee-71bdaafd147c"
      const apiKey = process.env.NEXT_PUBLIC_HUME_API_KEY

      if (!apiKey) {
        throw new Error("HUME_API_KEY not found in environment variables")
      }

      const wsUrl = `wss://api.hume.ai/v0/evi/chat?api_key=${apiKey}&config_id=${configId}`

      const socket = new WebSocket(wsUrl)
      socketRef.current = socket

      socket.onopen = () => {
        console.log("Connected to Hume EVI successfully with config:", configId)
        setIsConnected(true)
      }

      // Handle incoming messages
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
              // Initialize streaming audio for assistant response
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
          console.error("Failed to parse message:", error)
        }
      }

      socket.onerror = (error) => {
        console.error("Socket error:", error)
        setIsConnected(false)
        addErrorMessage("Connection error occurred")
      }

      socket.onclose = () => {
        console.log("Socket connection closed")
        setIsConnected(false)
        cleanup()
      }
    } catch (error) {
      console.error("Failed to connect to Hume EVI:", error)
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
   * Send audio input to EVI
   */
  const sendAudioInput = useCallback((base64Audio: string) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      const message = {
        type: "audio_input",
        data: base64Audio,
      }
      socketRef.current.send(JSON.stringify(message))
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
   * Initialize streaming audio for continuous playback
   */
  const initializeStreamingAudio = useCallback(() => {
    try {
      if (!voiceSettings.speakerEnabled || isStreamingAudioRef.current) return

      // Create MediaSource for streaming audio
      const mediaSource = new MediaSource()
      mediaSourceRef.current = mediaSource

      const audioUrl = URL.createObjectURL(mediaSource)
      const audio = new Audio(audioUrl)
      audio.volume = Math.min(voiceSettings.volume, 0.9)
      currentAudioRef.current = audio

      mediaSource.addEventListener("sourceopen", () => {
        try {
          // Try different audio formats based on browser support
          let mimeType = 'audio/webm; codecs="opus"'

          if (!MediaSource.isTypeSupported(mimeType)) {
            mimeType = 'audio/mp4; codecs="mp4a.40.2"'
            if (!MediaSource.isTypeSupported(mimeType)) {
              mimeType = "audio/mpeg"
            }
          }

          console.log("Using audio format:", mimeType)
          const sourceBuffer = mediaSource.addSourceBuffer(mimeType)
          sourceBufferRef.current = sourceBuffer

          sourceBuffer.addEventListener("updateend", () => {
            // Process any queued audio chunks
            if (audioChunksBuffer.current.length > 0) {
              const chunk = audioChunksBuffer.current.shift()
              if (chunk && sourceBuffer && !sourceBuffer.updating) {
                sourceBuffer.appendBuffer(chunk)
              }
            }
          })

          isStreamingAudioRef.current = true
          setConversationState((prev) => ({ ...prev, isPlaying: true }))

          // Start playing as soon as we have some data
          audio.play().catch(console.error)
        } catch (error) {
          console.error("Failed to setup source buffer:", error)
        }
      })
    } catch (error) {
      console.error("Failed to initialize streaming audio:", error)
    }
  }, [voiceSettings.speakerEnabled, voiceSettings.volume])

  /**
   * Handle streaming audio output chunks
   */
  const handleStreamingAudioOutput = useCallback(
    (base64Audio: string) => {
      try {
        if (!voiceSettings.speakerEnabled || !isStreamingAudioRef.current)
          return

        // Convert base64 to Uint8Array
        const binaryString = atob(base64Audio)
        const bytes = new Uint8Array(binaryString.length)
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i)
        }

        const sourceBuffer = sourceBufferRef.current
        if (sourceBuffer && !sourceBuffer.updating) {
          sourceBuffer.appendBuffer(bytes)
        } else {
          // Queue the chunk if source buffer is busy
          audioChunksBuffer.current.push(bytes)
        }
      } catch (error) {
        console.error("Failed to handle streaming audio:", error)
      }
    },
    [voiceSettings.speakerEnabled]
  )

  /**
   * Finalize streaming audio when assistant finishes
   */
  const finalizeStreamingAudio = useCallback(() => {
    try {
      const mediaSource = mediaSourceRef.current
      if (mediaSource && mediaSource.readyState === "open") {
        mediaSource.endOfStream()
      }

      isStreamingAudioRef.current = false

      // Clean up when audio finishes
      if (currentAudioRef.current) {
        currentAudioRef.current.onended = () => {
          setConversationState((prev) => ({ ...prev, isPlaying: false }))
          if (currentAudioRef.current) {
            URL.revokeObjectURL(currentAudioRef.current.src)
            currentAudioRef.current = null
          }
          mediaSourceRef.current = null
          sourceBufferRef.current = null
          audioChunksBuffer.current = []
        }
      }
    } catch (error) {
      console.error("Failed to finalize streaming audio:", error)
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

      mediaRecorder.start(250) // Reduce frequency to prevent buffer overflow

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
   * Cleanup all resources
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

    // Close socket
    if (socketRef.current) {
      socketRef.current.close()
      socketRef.current = null
    }

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
