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
          'flex w-full mb-4 items-start space-x-3',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        {/* Assistant Avatar (left side) */}
        {!isUser && (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-purple-400/50 shadow-lg backdrop-blur-sm bg-gray-800/50">
              <Image
                src="/chatuser.png"
                alt="Freja AI Avatar"
                width={40}
                height={40}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image doesn't load
                  const target = e.currentTarget;
                  const fallback = target.nextElementSibling as HTMLElement;
                  if (target && fallback) {
                    target.style.display = 'none';
                    fallback.style.display = 'flex';
                  }
                }}
              />
              <div className="w-full h-full bg-gradient-to-br from-purple-500 to-pink-500 items-center justify-center text-white text-sm font-bold hidden">
                AI
              </div>
            </div>
            <span className="text-xs text-gray-400 font-medium">{assistantName}</span>
          </div>
        )}

        <div
          className={clsx(
            'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-lg backdrop-blur-sm',
            isUser
              ? 'bg-gradient-to-br from-blue-500/90 to-purple-600/90 text-white border border-blue-400/30'
              : 'bg-gray-800/90 text-gray-100 border border-gray-600/50'
          )}
        >
          {/* Message content */}
          <div className="text-sm mb-2 font-medium">{message.content}</div>
          
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
            <div className="mt-2 flex flex-wrap gap-1">
              {message.emotions.slice(0, 3).map((emotion) => (
                <span
                  key={emotion.name}
                  className="px-2 py-1 bg-gray-700/70 backdrop-blur-sm rounded-full text-xs text-gray-200 border border-gray-600/50"
                  title={`${emotion.name}: ${(emotion.score * 100).toFixed(0)}%`}
                >
                  {emotion.name} {(emotion.score * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <div className="text-xs opacity-70 mt-1 font-mono">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>

        {/* User Avatar (right side) */}
        {isUser && (
          <div className="flex flex-col items-center space-y-1">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-blue-400/50 shadow-lg backdrop-blur-sm flex items-center justify-center">
              <span className="text-white text-sm font-bold">R</span>
            </div>
            <span className="text-xs text-gray-400 font-medium">{userName}</span>
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
          backgroundPosition: 'center top', // Focus on upper portion where face is likely located
          // Alternative positioning options to try:
          // backgroundPosition: 'center 20%',     // Face slightly below top
          // backgroundPosition: 'center 30%',     // Face in upper-middle area
          // backgroundPosition: '40% 20%',        // Face positioned left-of-center, upper area
          // backgroundPosition: '60% 20%',        // Face positioned right-of-center, upper area
          // backgroundPosition: 'center center',  // Standard center positioning
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
          filter: 'blur(2px)',
          transform: 'scale(1.1)', // Slightly larger scale to better frame the face
        }}
      />
      
      {/* Overlay to ensure text readability */}
      <div className="absolute inset-0 bg-black/50" />
      
      {/* Content with relative positioning to appear above background */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-900/90 backdrop-blur-sm border-b border-gray-800/50">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 flex items-center justify-center bg-gray-800/90 backdrop-blur-sm rounded-xl p-2 border border-gray-700 shadow-lg">
              <Image
                src="/logo.png"
                alt="Freja AI Logo"
                width={40}
                height={40}
                className="w-full h-full object-contain"
                priority
              />
            </div>
            
            {/* Connection status */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleConnectionToggle}
                className={clsx(
                  'p-2 rounded-lg transition-colors backdrop-blur-sm',
                  isConnected
                    ? 'text-green-400 bg-green-400/20 hover:bg-green-400/30'
                    : 'text-red-400 bg-red-400/20 hover:bg-red-400/30'
                )}
                title={isConnected ? 'Disconnect from Hume EVI' : 'Connect to Hume EVI'}
              >
                {isConnected ? (
                  <Wifi className="w-5 h-5" />
                ) : (
                  <WifiOff className="w-5 h-5" />
                )}
              </button>
              <span className={clsx(
                'text-xs font-medium',
                isConnected ? 'text-green-400' : 'text-red-400'
              )}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {/* Clear conversation button */}
            <button
              onClick={clearConversation}
              disabled={conversationState.messages.length === 0}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 backdrop-blur-sm rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Clear conversation"
            >
              <Trash2 className="w-5 h-5" />
            </button>
            
            {/* Settings button */}
            <button
              onClick={toggleSettings}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-800/50 backdrop-blur-sm rounded-lg transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className="bg-gray-900/90 backdrop-blur-sm border-b border-gray-800/50 p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-300">Voice Settings</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Microphone toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Microphone</span>
                <button
                  onClick={() => updateVoiceSettings({ 
                    microphoneEnabled: !voiceSettings.microphoneEnabled 
                  })}
                  className={clsx(
                    'p-2 rounded-lg transition-colors backdrop-blur-sm',
                    voiceSettings.microphoneEnabled
                      ? 'text-green-400 bg-green-400/20'
                      : 'text-red-400 bg-red-400/20'
                  )}
                >
                  {voiceSettings.microphoneEnabled ? (
                    <Mic className="w-5 h-5" />
                  ) : (
                    <MicOff className="w-5 h-5" />
                  )}
                </button>
              </div>
              
              {/* Speaker toggle */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Speaker</span>
                <button
                  onClick={() => updateVoiceSettings({ 
                    speakerEnabled: !voiceSettings.speakerEnabled 
                  })}
                  className={clsx(
                    'p-2 rounded-lg transition-colors backdrop-blur-sm',
                    voiceSettings.speakerEnabled
                      ? 'text-green-400 bg-green-400/20'
                      : 'text-red-400 bg-red-400/20'
                  )}
                >
                  {voiceSettings.speakerEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>
            
            {/* Volume slider */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-300">Volume</span>
                <span className="text-xs text-gray-500">
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
                className="w-full h-2 bg-gray-700/50 backdrop-blur-sm rounded-lg appearance-none cursor-pointer"
              />
            </div>
            
            {/* Auto-play toggle */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-300">Auto-play responses</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={voiceSettings.autoPlay}
                  onChange={(e) => updateVoiceSettings({ 
                    autoPlay: e.target.checked 
                  })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-700/50 backdrop-blur-sm peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        )}

        {/* Messages area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {conversationState.messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
              <div className="space-y-4">
                <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 backdrop-blur-sm rounded-3xl flex items-center justify-center border border-gray-700/50">
                  <div className="text-4xl">🎙️</div>
                </div>
                <div className="space-y-2">
                  <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                    Welcome, Robert!
                  </h2>
                  <p className="text-gray-200 max-w-md leading-relaxed backdrop-blur-sm bg-black/20 rounded-lg p-4">
                    {isConnected 
                      ? "Connected to Freja AI! Tap the microphone button below to begin our conversation."
                      : "Connect to Freja AI first by clicking the connection button above, then tap the microphone to start chatting."
                    }
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <>
              {conversationState.messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Voice input area */}
        <div className="p-6 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800/50">
          <div className="flex justify-center">
            <VoiceButton
              isRecording={conversationState.isRecording}
              isProcessing={conversationState.isProcessing}
              onStartRecording={handleStartRecording}
              onStopRecording={stopRecording}
              disabled={!voiceSettings.microphoneEnabled || !isConnected}
            />
          </div>

          {/* Status indicator */}
          <div className="flex flex-col items-center mt-4 space-y-2">
            {conversationState.isPlaying && (
              <div className="flex items-center justify-center text-green-400 text-sm bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <Volume2 className="w-4 h-4 mr-2" />
                Playing response...
              </div>
            )}
            
            {!isConnected && (
              <div className="flex items-center justify-center text-red-400 text-sm bg-black/20 backdrop-blur-sm rounded-lg px-3 py-2">
                <WifiOff className="w-4 h-4 mr-2" />
                Not connected to Hume AI
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 