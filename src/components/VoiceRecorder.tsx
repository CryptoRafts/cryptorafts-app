"use client";

import { useState, useRef, useEffect } from "react";
import { MicrophoneIcon, StopIcon, PlayIcon, PauseIcon, XMarkIcon } from "@heroicons/react/24/solid";

interface Props {
  onSend: (audioBlob: Blob, duration: number) => void;
  onClose: () => void;
}

export default function VoiceRecorder({ onSend, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) audioRef.current.pause();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  };

  const playPreview = () => {
    if (!audioBlob) return;

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    } else {
      const audio = new Audio(URL.createObjectURL(audioBlob));
      audio.addEventListener('ended', () => setIsPlaying(false));
      audio.play();
      setIsPlaying(true);
      audioRef.current = audio;
    }
  };

  const handleSend = () => {
    if (audioBlob && duration > 0) {
      onSend(audioBlob, duration);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 border border-white/20 rounded-2xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">🎤 Voice Note</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <XMarkIcon className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Recording Indicator */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {isRecording ? (
            <div className="relative">
              <div className="w-24 h-24 bg-red-600 rounded-full flex items-center justify-center animate-pulse">
                <MicrophoneIcon className="w-12 h-12 text-white" />
              </div>
              <div className="absolute -inset-4 border-4 border-red-600 rounded-full animate-ping opacity-20" />
            </div>
          ) : audioBlob ? (
            <div className="w-24 h-24 bg-green-600 rounded-full flex items-center justify-center">
              <MicrophoneIcon className="w-12 h-12 text-white" />
            </div>
          ) : (
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center">
              <MicrophoneIcon className="w-12 h-12 text-white" />
            </div>
          )}

          {/* Duration */}
          <div className="text-3xl font-mono font-bold text-white">
            {formatDuration(duration)}
          </div>

          {isRecording && (
            <p className="text-sm text-white/60">Recording...</p>
          )}
        </div>

        {/* Waveform Visualization */}
        {isRecording && (
          <div className="flex items-center justify-center gap-1 mb-6 h-16">
            {Array.from({ length: 30 }).map((_, i) => (
              <div
                key={i}
                className="w-1 bg-red-500 rounded-full animate-pulse"
                style={{
                  height: `${Math.random() * 100}%`,
                  animationDelay: `${i * 50}ms`
                }}
              />
            ))}
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
            >
              <MicrophoneIcon className="w-5 h-5" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
            >
              <StopIcon className="w-5 h-5" />
              Stop
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={playPreview}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-medium flex items-center gap-2 transition-colors"
              >
                {isPlaying ? (
                  <>
                    <PauseIcon className="w-5 h-5" />
                    Pause
                  </>
                ) : (
                  <>
                    <PlayIcon className="w-5 h-5" />
                    Preview
                  </>
                )}
              </button>

              <button
                onClick={handleSend}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-colors"
              >
                Send
              </button>

              <button
                onClick={() => {
                  setAudioBlob(null);
                  setDuration(0);
                  if (audioRef.current) {
                    audioRef.current.pause();
                    audioRef.current = null;
                  }
                  setIsPlaying(false);
                }}
                className="px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-full font-medium transition-colors"
              >
                Reset
              </button>
            </>
          )}
        </div>

        {audioBlob && (
          <p className="text-xs text-center text-white/60 mt-4">
            Preview your recording before sending
          </p>
        )}
      </div>
    </div>
  );
}

