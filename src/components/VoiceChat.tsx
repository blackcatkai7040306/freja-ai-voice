'use client';

import { useState, useEffect, useRef } from 'react';
import { Settings, Trash2, Volume2, VolumeX, Mic, MicOff } from 'lucide-react';
import Image from 'next/image';
import { VoiceButton } from './VoiceButton';
import { useVoiceChat } from '@/hooks/useVoiceChat';
import { VoiceMessage } from '@/types/hume';
import { clsx } from 'clsx';

/**
 * Main voice chat interface component
 * Handles the complete voice conversation experience with Hume AI
 */
export const VoiceChat: React.FC = () => {
  const {
    conversationState,
    voiceSettings,
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
   * Render individual message
   */
  const renderMessage = (message: VoiceMessage) => {
    const isUser = message.type === 'user';
    
    return (
      <div
        key={message.id}
        className={clsx(
          'flex w-full mb-4',
          isUser ? 'justify-end' : 'justify-start'
        )}
      >
        <div
          className={clsx(
            'max-w-xs lg:max-w-md px-4 py-3 rounded-2xl shadow-md',
            isUser
              ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white'
              : 'bg-gray-800 text-gray-100 border border-gray-700'
          )}
        >
          {/* Message content */}
          <div className="text-sm mb-2">{message.content}</div>
          
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
                  className="px-2 py-1 bg-gray-700 rounded-full text-xs text-gray-300"
                  title={`${emotion.name}: ${(emotion.score * 100).toFixed(0)}%`}
                >
                  {emotion.name} {(emotion.score * 100).toFixed(0)}%
                </span>
              ))}
            </div>
          )}
          
          {/* Timestamp */}
          <div className="text-xs opacity-70 mt-1">
            {message.timestamp.toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-900 border-b border-gray-800">
        <div className="flex items-center">
          <div className="w-12 h-12 flex items-center justify-center bg-gray-800 rounded-xl p-2 border border-gray-700 shadow-lg">
            <Image
              src="/logo.png"
              alt="Freja AI Logo"
              width={40}
              height={40}
              className="w-full h-full object-contain"
              priority
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {/* Clear conversation button */}
          <button
            onClick={clearConversation}
            disabled={conversationState.messages.length === 0}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Clear conversation"
          >
            <Trash2 className="w-5 h-5" />
          </button>
          
          {/* Settings button */}
          <button
            onClick={toggleSettings}
            className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-lg transition-colors"
            title="Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Settings panel */}
      {showSettings && (
        <div className="bg-gray-900 border-b border-gray-800 p-4 space-y-4">
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
                  'p-2 rounded-lg transition-colors',
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
                  'p-2 rounded-lg transition-colors',
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
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
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
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {conversationState.messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6">
            <div className="space-y-4">
              <div className="w-24 h-24 bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-3xl flex items-center justify-center border border-gray-700">
                <div className="text-4xl">🎙️</div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                  Start Your Conversation
                </h2>
                <p className="text-gray-400 max-w-md leading-relaxed">
                  Tap the microphone button below to begin an intelligent voice conversation with AI.
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
      <div className="p-6 bg-gray-900 border-t border-gray-800">
        <div className="flex justify-center">
          <VoiceButton
            isRecording={conversationState.isRecording}
            isProcessing={conversationState.isProcessing}
            onStartRecording={startRecording}
            onStopRecording={stopRecording}
            disabled={!voiceSettings.microphoneEnabled}
          />
        </div>

        {/* Status indicator */}
        {conversationState.isPlaying && (
          <div className="flex items-center justify-center mt-4 text-green-400 text-sm">
            <Volume2 className="w-4 h-4 mr-2" />
            Playing response...
          </div>
        )}
      </div>
    </div>
  );
}; 