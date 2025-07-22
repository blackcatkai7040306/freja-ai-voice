'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Volume2, VolumeX, Mic, MicOff, Wifi, WifiOff } from 'lucide-react';
import Image from 'next/image';
import { VoiceButton } from './VoiceButton';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceMessage } from '@/types/hume';
import { clsx } from 'clsx';

/**
 * Main voice chat interface component
 * Handles the complete voice conversation experience with Hume AI EVI
 */
export const VoiceChat: React.FC = () => {
  const {
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
  } = useVoiceChat();

  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversationState.messages]);

  /**
   * Handle settings toggle
   */
  const toggleSettings = () => {
    setShowSettings(!showSettings);
  };

  /**
   * Handle connection toggle
   */
  const handleConnectionToggle = async () => {
    try {
      if (isConnected) {
        disconnect();
      } else {
        await connect();
      }
    } catch (error) {
      console.error('Connection toggle failed:', error);
    }
  };

  /**
   * Handle voice recording
   */
  const handleStartRecording = async () => {
    try {
      await startRecording();
    } catch (error) {
      console.error('Failed to start recording:', error);
    }
  };

  /**
   * Render individual message
   */
  const renderMessage = (message: VoiceMessage) => {
    const isUser = message.type === 'user';
    const userName = 'Robert';
    const assistantName = 'Freja AI';
    
    return (
      <div
        key={message.id}
        className={clsx(
          'flex w-full mb-4 md:mb-6 items-end space-x-3 md:space-x-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {/* Assistant Avatar (left side) */}
        {!isUser && (
          <div className="flex flex-col items-center space-y-2 mb-1">
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full overflow-hidden border-2 border-purple-400/70 shadow-xl backdrop-blur-sm bg-gray-800/60 ring-2 ring-purple-300/30">
              <Image
                src="/chatuser.png"
                alt="Freja AI Avatar"
                width={56}
                height={56}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.currentTarget;
                  const parent = target.parentElement;
                  if (parent) {
                    parent.innerHTML = '<div class="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-lg font-bold">AI</div>';
                  }
                }}
              />
            </div>
            <span 
              className="text-xs font-semibold"
              style={{
                color: '#C4B5FD', // Light purple
                textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              {assistantName}
            </span>
          </div>
        )}

        {/* Message bubble */}
        <div
          className={clsx(
            'max-w-[320px] sm:max-w-md md:max-w-lg px-4 md:px-5 py-3 md:py-4 rounded-2xl shadow-xl backdrop-blur-sm',
            isUser
              ? 'bg-gradient-to-br from-blue-600/95 to-purple-700/95 border border-blue-400/60 rounded-br-md'
              : 'bg-gray-900/95 border border-gray-500/70 rounded-bl-md'
          )}
          style={{
            backgroundColor: isUser ? undefined : 'rgba(17, 24, 39, 0.95)', // Force dark background for AI messages
          }}
        >
          {/* Message content */}
          <div 
            className="text-sm md:text-base lg:text-lg mb-2 font-semibold leading-relaxed"
            style={{
              color: isUser ? '#FFFFFF' : '#F8FAFC', // Force white/near-white text
              textShadow: isUser ? '0 1px 2px rgba(0,0,0,0.5)' : '0 1px 2px rgba(0,0,0,0.8)', // Add text shadow for better visibility
            }}
          >
            {message.content}
          </div>
          
          {/* Audio player for user messages */}
          {isUser && message.audioUrl && (
            <audio
              controls
              className="w-full mt-2 h-8"
            >
              <source src={message.audioUrl} type="audio/webm" />
            </audio>
          )}
          
          {/* Emotion indicators for assistant messages */}
          {!isUser && message.emotions && message.emotions.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {message.emotions.slice(0, 3).map((emotion) => (
                <span
                  key={emotion.name}
                  className="px-3 py-1 rounded-full text-xs border font-bold"
                  style={{
                    backgroundColor: 'rgba(31, 41, 55, 0.9)', // Force dark background
                    color: '#F1F5F9', // Force light text
                    borderColor: 'rgba(107, 114, 128, 0.6)',
                    textShadow: '0 1px 2px rgba(0,0,0,0.8)',
                  }}
                  title={`${emotion.name}: ${(emotion.score * 100).toFixed(0)}%`}
                >
                  <span className="hidden sm:inline">{emotion.name} </span>
                  {(emotion.score * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <div 
            className="text-xs mt-2 font-mono font-medium opacity-75"
            style={{
              color: isUser ? 'rgba(219, 234, 254, 0.9)' : 'rgba(209, 213, 219, 0.95)', // Force light colors
            }}
          >
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {/* User Avatar (right side) */}
        {isUser && (
          <div className="flex flex-col items-center space-y-2 mb-1">
            <div className="w-10 h-10 md:w-12 md:h-12 lg:w-14 lg:h-14 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-400/70 shadow-xl backdrop-blur-sm flex items-center justify-center ring-2 ring-blue-300/30">
              <span className="text-white text-sm md:text-base lg:text-lg font-bold">R</span>
            </div>
            <span 
              className="text-xs font-semibold"
              style={{
                color: '#93C5FD', // Light blue
                textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
              }}
            >
              {userName}
            </span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0"
        style={{
          backgroundImage: 'url(/background.png)',
          backgroundSize: 'cover',
          backgroundPosition: 'center top', // Focus on the top area where face likely is
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'blur(1.5px)', // Slightly less blur to show more detail
          transform: 'scale(1.02)', // Less scaling to maintain image quality
        }}
      />
      
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content with relative positioning to appear above background */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 md:p-5 bg-gray-900/95 backdrop-blur-sm border-b border-gray-800/60">
          <div className="flex items-center space-x-3 md:space-x-4">
            <div className="w-12 h-12 md:w-14 md:h-14 flex items-center justify-center bg-gray-800/90 backdrop-blur-sm rounded-xl p-2 border border-gray-700 shadow-lg">
              <Image
                src="/logo.png"
                alt="Freja AI Logo"
                width={48}
                height={48}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            
            <div className="flex flex-col">
              <h1 
                className="text-lg md:text-xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent"
                style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                }}
              >
                Freja AI
              </h1>
              <span 
                className="text-xs md:text-sm font-medium"
                style={{
                  color: isConnected ? '#86EFAC' : '#FCA5A5', // Force bright colors
                  textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                }}
              >
                {isConnected ? 'Connected & Ready' : 'Disconnected'} 
                {conversationState.messages.length > 0 && (
                  <span className="ml-2">• {conversationState.messages.length} message{conversationState.messages.length !== 1 ? 's' : ''}</span>
                )}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2 md:space-x-3">
            {/* Clear conversation button */}
            <button
              onClick={clearConversation}
              disabled={conversationState.messages.length === 0}
              className="p-2 md:p-3 text-gray-400 hover:text-white hover:bg-gray-800/50 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed border border-gray-700/50"
              title="Clear conversation"
            >
              <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
            </button>
            
            {/* Settings button */}
            <button
              onClick={toggleSettings}
              className={clsx(
                'p-2 md:p-3 backdrop-blur-sm rounded-lg transition-colors border border-gray-700/50',
                showSettings 
                  ? 'text-blue-400 bg-blue-400/20 border-blue-400/50' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
              )}
              title="Voice Settings"
            >
              <Settings className="w-4 h-4 md:w-5 md:h-5" />
            </button>

            {/* Connection toggle button */}
            <button
              onClick={handleConnectionToggle}
              className={clsx(
                'p-2 md:p-3 rounded-lg transition-all backdrop-blur-sm shadow-lg border',
                isConnected
                  ? 'text-green-400 bg-green-400/20 hover:bg-green-400/30 border-green-400/50'
                  : 'text-red-400 bg-red-400/20 hover:bg-red-400/30 border-red-400/50'
              )}
              title={isConnected ? 'Disconnect from Hume EVI' : 'Connect to Hume EVI'}
            >
              {isConnected ? (
                <Wifi className="w-4 h-4 md:w-5 md:h-5" />
              ) : (
                <WifiOff className="w-4 h-4 md:w-5 md:h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div 
            className="backdrop-blur-sm border-b p-4 md:p-5 space-y-4 md:space-y-5"
            style={{
              backgroundColor: 'rgba(17, 24, 39, 0.95)', // Force very dark background
              borderBottomColor: 'rgba(55, 65, 81, 0.6)',
            }}
          >
            <h3 
              className="text-base md:text-lg font-bold"
              style={{
                color: '#F8FAFC', // Force very light text
                textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
              }}
            >
              Voice Settings
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
              {/* Microphone toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <span 
                  className="text-sm md:text-base font-semibold"
                  style={{
                    color: '#F1F5F9', // Force light text
                  }}
                >
                  Microphone
                </span>
                <button
                  onClick={() => updateVoiceSettings({ 
                    microphoneEnabled: !voiceSettings.microphoneEnabled 
                  })}
                  className={clsx(
                    'p-2 md:p-3 rounded-lg transition-colors backdrop-blur-sm',
                    voiceSettings.microphoneEnabled
                      ? 'text-green-400 bg-green-400/20 border border-green-400/50'
                      : 'text-red-400 bg-red-400/20 border border-red-400/50'
                  )}
                >
                  {voiceSettings.microphoneEnabled ? (
                    <Mic className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <MicOff className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
              </div>
              
              {/* Speaker toggle */}
              <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
                <span 
                  className="text-sm md:text-base font-semibold"
                  style={{
                    color: '#F1F5F9', // Force light text
                  }}
                >
                  Speaker
                </span>
                <button
                  onClick={() => updateVoiceSettings({ 
                    speakerEnabled: !voiceSettings.speakerEnabled 
                  })}
                  className={clsx(
                    'p-2 md:p-3 rounded-lg transition-colors backdrop-blur-sm',
                    voiceSettings.speakerEnabled
                      ? 'text-green-400 bg-green-400/20 border border-green-400/50'
                      : 'text-red-400 bg-red-400/20 border border-red-400/50'
                  )}
                >
                  {voiceSettings.speakerEnabled ? (
                    <Volume2 className="w-5 h-5 md:w-6 md:h-6" />
                  ) : (
                    <VolumeX className="w-5 h-5 md:w-6 md:h-6" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Volume slider */}
            <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm md:text-base font-semibold"
                  style={{
                    color: '#F1F5F9', // Force light text
                  }}
                >
                  Volume
                </span>
                <span 
                  className="text-sm font-bold px-2 py-1 bg-gray-700/50 rounded"
                  style={{
                    color: '#E2E8F0', // Force light text
                  }}
                >
                  {Math.round(voiceSettings.volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={voiceSettings.volume}
                onChange={(e) => updateVoiceSettings({ 
                  volume: parseFloat(e.target.value) 
                })}
                className="w-full h-3 bg-gray-700/50 backdrop-blur-sm rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Speech Speed slider */}
            <div className="space-y-3 p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
              <div className="flex items-center justify-between">
                <span 
                  className="text-sm md:text-base font-semibold"
                  style={{
                    color: '#F1F5F9', // Force light text
                  }}
                >
                  Speech Speed
                </span>
                <span 
                  className="text-sm font-bold px-2 py-1 bg-gray-700/50 rounded"
                  style={{
                    color: '#E2E8F0', // Force light text
                  }}
                >
                  {voiceSettings.speechSpeed.toFixed(1)}x
                </span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={voiceSettings.speechSpeed}
                onChange={(e) => updateSpeechSpeed(parseFloat(e.target.value))}
                className="w-full h-3 bg-gray-700/50 backdrop-blur-sm rounded-lg appearance-none cursor-pointer"
              />
              <div 
                className="flex justify-between text-xs font-medium"
                style={{
                  color: '#E2E8F0', // Force light text
                }}
              >
                <span>Slow (0.5x)</span>
                <span>Normal (1.0x)</span>
                <span>Fast (2.0x)</span>
              </div>
            </div>
            
            {/* Auto-play toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg border border-gray-600/50">
              <span 
                className="text-sm md:text-base font-semibold"
                style={{
                  color: '#F1F5F9', // Force light text
                }}
              >
                Auto-play responses
              </span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceSettings.autoPlay}
                  onChange={(e) => updateVoiceSettings({ 
                    autoPlay: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-12 h-7 bg-gray-700/50 backdrop-blur-sm peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 flex flex-col min-h-0">
          <div 
            className="flex-1 overflow-y-auto px-4 md:px-6 py-6 md:py-8 custom-scrollbar"
          >
            {conversationState.messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center space-y-6 md:space-y-8 px-4">
                <div className="space-y-4 md:space-y-6">
                  <div className="w-24 h-24 md:w-32 md:h-32 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-gray-700/50 shadow-xl">
                    <div className="text-4xl md:text-5xl">🎙️</div>
                  </div>
                  <div className="space-y-3 md:space-y-4">
                    <h2 
                      className="text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-300 to-purple-300 bg-clip-text text-transparent drop-shadow-sm"
                      style={{
                        textShadow: '2px 2px 4px rgba(0,0,0,0.8)',
                      }}
                    >
                      Welcome, Robert!
                    </h2>
                    <p 
                      className="max-w-lg leading-relaxed backdrop-blur-sm rounded-xl p-4 md:p-6 text-base md:text-lg font-semibold border border-gray-600/30"
                      style={{
                        backgroundColor: 'rgba(0, 0, 0, 0.7)', // Force darker background
                        color: '#F8FAFC', // Force very light text
                        textShadow: '1px 1px 2px rgba(0,0,0,0.9)',
                      }}
                    >
                      {isConnected 
                        ? "Connected to Freja AI! Tap the microphone button below to begin our conversation."
                        : "Connect to Freja AI first by clicking the connection button above, then tap the microphone to start chatting."
                      }
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4 md:space-y-6 max-w-4xl mx-auto">
                {conversationState.messages.map(renderMessage)}
                <div ref={messagesEndRef} />
              </div>
            )}
          </div>
        </div>

        {/* Voice input area */}
        <div className="p-5 md:p-8 bg-gray-900/95 backdrop-blur-sm border-t border-gray-800/60">
          <div className="flex flex-col items-center space-y-4 max-w-2xl mx-auto">
            <VoiceButton
              isRecording={conversationState.isRecording}
              isProcessing={conversationState.isProcessing}
              onStartRecording={handleStartRecording}
              onStopRecording={stopRecording}
              disabled={!voiceSettings.microphoneEnabled || !isConnected}
            />

            {/* Status indicator */}
            <div className="flex flex-col items-center space-y-3">
              {conversationState.isPlaying && (
                <div 
                  className="flex items-center justify-center text-sm md:text-base rounded-xl px-4 py-3 border font-bold shadow-lg backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Force dark background
                    color: '#86EFAC', // Force bright green
                    borderColor: 'rgba(34, 197, 94, 0.5)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  <Volume2 className="w-5 h-5 mr-3" />
                  <span className="hidden sm:inline">Playing AI response...</span>
                  <span className="sm:hidden">Playing...</span>
                </div>
              )}
              
              {!isConnected && (
                <div 
                  className="flex items-center justify-center text-sm md:text-base rounded-xl px-4 py-3 border font-bold shadow-lg backdrop-blur-sm"
                  style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)', // Force dark background
                    color: '#FCA5A5', // Force bright red
                    borderColor: 'rgba(239, 68, 68, 0.5)',
                    textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
                  }}
                >
                  <WifiOff className="w-5 h-5 mr-3" />
                  <span className="hidden sm:inline">Not connected to Hume AI</span>
                  <span className="sm:hidden">Not connected</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}; 