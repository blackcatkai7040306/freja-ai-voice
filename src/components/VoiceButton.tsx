'use client';

import { useState, useEffect } from 'react';
import { Mic, MicOff, Square } from 'lucide-react';
import { clsx } from 'clsx';

interface VoiceButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
  disabled?: boolean;
}

/**
 * Voice recording button component with visual feedback
 * Provides intuitive interface for starting/stopping voice recording
 */
export const VoiceButton: React.FC<VoiceButtonProps> = ({
  isRecording,
  isProcessing,
  onStartRecording,
  onStopRecording,
  disabled = false,
}) => {
  const [recordingTime, setRecordingTime] = useState(0);

  // Track recording duration
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    } else {
      setRecordingTime(0);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [isRecording]);

  /**
   * Handle voice button click
   */
  const handleClick = () => {
    if (disabled || isProcessing) return;

    if (isRecording) {
      onStopRecording();
    } else {
      onStartRecording();
    }
  };

  /**
   * Format recording time display
   */
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Main voice button */}
      <button
        onClick={handleClick}
        disabled={disabled || isProcessing}
        className={clsx(
          'relative flex items-center justify-center w-20 h-20 rounded-full transition-all duration-300 focus:outline-none',
          {
            // Default state
            'bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl':
              !isRecording && !isProcessing && !disabled,
            
            // Recording state
            'bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg hover:shadow-xl animate-pulse':
              isRecording && !disabled,
            
            // Processing state
            'bg-gradient-to-br from-yellow-500 to-orange-600 cursor-not-allowed':
              isProcessing,
            
            // Disabled state
            'bg-gray-600 cursor-not-allowed opacity-50':
              disabled && !isProcessing,
          }
        )}
      >
        {/* Pulsing ring animation during recording */}
        {isRecording && (
          <div className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-30" />
        )}

        {/* Button icon */}
        <div className="relative z-10 text-white">
          {isProcessing ? (
            <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRecording ? (
            <Square className="w-8 h-8" fill="currentColor" />
          ) : disabled ? (
            <MicOff className="w-8 h-8" />
          ) : (
            <Mic className="w-8 h-8" />
          )}
        </div>

        {/* Recording progress ring */}
        {isRecording && (
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <circle
              cx="50%"
              cy="50%"
              r="38"
              stroke="rgba(255,255,255,0.3)"
              strokeWidth="2"
              fill="none"
            />
            <circle
              cx="50%"
              cy="50%"
              r="38"
              stroke="white"
              strokeWidth="2"
              fill="none"
              strokeDasharray={`${2 * Math.PI * 38}`}
              strokeDashoffset={`${2 * Math.PI * 38 * (1 - recordingTime / 60)}`}
              className="transition-all duration-1000"
            />
          </svg>
        )}
      </button>

      {/* Status text */}
      <div className="text-center space-y-1">
        {isRecording ? (
          <>
            <div className="text-red-400 font-medium text-sm">
              Recording...
            </div>
            <div className="text-gray-400 text-xs font-mono">
              {formatTime(recordingTime)}
            </div>
          </>
        ) : isProcessing ? (
          <div className="text-yellow-400 font-medium text-sm">
            Processing...
          </div>
        ) : disabled ? (
          <div className="text-gray-500 text-sm">
            Microphone disabled
          </div>
        ) : (
          <div className="text-gray-400 text-sm">
            Tap to speak
          </div>
        )}
      </div>

      {/* Quick action hint */}
      {!isRecording && !isProcessing && !disabled && (
        <div className="text-xs text-gray-500 text-center max-w-xs">
          Hold to record, release to send
        </div>
      )}
    </div>
  );
}; 