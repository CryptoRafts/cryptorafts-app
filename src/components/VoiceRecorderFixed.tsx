"use client";

import { useState, useRef, useEffect } from "react";
import { NeonCyanIcon } from '@/components/icons/NeonCyanIcon';

interface Props {
  onSend: (audioBlob: Blob, duration: number) => void;
  onClose: () => void;
}

export default function VoiceRecorderFixed({ onSend, onClose }: Props) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup
      if (timerRef.current) clearInterval(timerRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request microphone permission
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      streamRef.current = stream;
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm;codecs=opus' });
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100); // Collect data every 100ms for smooth waveform
      setIsRecording(true);
      
      // Start timer
      setDuration(0);
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 0.1);
      }, 100);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Could not access microphone. Please check permissions.');
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
      audio.addEventListener('error', () => {
        console.error('Error playing audio');
        setIsPlaying(false);
      });
      audio.play();
      setIsPlaying(true);
      audioRef.current = audio;
    }
  };

  const handleSend = () => {
    if (audioBlob && duration > 0) {
      onSend(audioBlob, Math.round(duration));
      onClose();
    }
  };

  const handleDiscard = () => {
    setAudioBlob(null);
    setDuration(0);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  // Generate waveform data for visualization
  const generateWaveform = () => {
    const bars = 50;
    const waveform = [];
    for (let i = 0; i < bars; i++) {
      if (isRecording) {
        waveform.push(Math.random() * 100);
      } else {
        waveform.push(20 + Math.sin(i * 0.3) * 30);
      }
    }
    return waveform;
  };

  const waveform = generateWaveform();

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md flex items-center justify-center z-[9998] p-4">
      <div className="neo-glass-card rounded-2xl p-6 max-w-md w-full relative z-[9999]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-white">🎤 Voice Message</h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-cyan-500/20 rounded-lg transition-colors border border-transparent hover:border-cyan-400/30"
          >
            <NeonCyanIcon type="close" size={20} className="text-white" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {/* Recording Indicator */}
        <div className="flex flex-col items-center gap-4 mb-6">
          {isRecording ? (
            <div className="relative">
              <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center animate-pulse border-2 border-red-400/50">
                <NeonCyanIcon type="microphone" size={40} className="text-white" />
              </div>
              <div className="absolute -inset-3 border-4 border-red-600 rounded-full animate-ping opacity-20" />
            </div>
          ) : audioBlob ? (
            <div className="w-20 h-20 bg-green-600 rounded-full flex items-center justify-center border-2 border-green-400/50">
              <NeonCyanIcon type="microphone" size={40} className="text-white" />
            </div>
          ) : (
            <div className="w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full flex items-center justify-center border-2 border-cyan-400/50 shadow-lg shadow-cyan-500/20">
              <NeonCyanIcon type="microphone" size={40} className="text-white" />
            </div>
          )}

          {/* Duration */}
          <div className="text-2xl font-mono font-bold text-white">
            {formatDuration(duration)}
          </div>

          {isRecording && (
            <p className="text-sm text-red-400 font-medium">Recording...</p>
          )}
        </div>

        {/* Waveform Visualization */}
        <div className="flex items-center justify-center gap-1 mb-6 h-16">
          {waveform.map((height, i) => (
            <div
              key={i}
              className={`w-1 rounded-full transition-all duration-100 ${
                isRecording ? 'bg-red-500 animate-pulse' : 'bg-blue-500'
              }`}
              style={{
                height: `${height}%`,
                animationDelay: `${i * 20}ms`
              }}
            />
          ))}
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-4">
          {!isRecording && !audioBlob && (
            <button
              onClick={startRecording}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-3 transition-colors shadow-lg border border-red-400/30"
            >
              <NeonCyanIcon type="microphone" size={24} className="text-white" />
              Start Recording
            </button>
          )}

          {isRecording && (
            <button
              onClick={stopRecording}
              className="px-8 py-4 bg-red-600 hover:bg-red-700 text-white rounded-full font-medium flex items-center gap-3 transition-colors shadow-lg border border-red-400/30"
            >
              <NeonCyanIcon type="stop" size={24} className="text-white" />
              Stop Recording
            </button>
          )}

          {audioBlob && !isRecording && (
            <>
              <button
                onClick={playPreview}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white rounded-full font-medium flex items-center gap-2 transition-colors shadow-lg shadow-cyan-500/20"
              >
                {isPlaying ? (
                  <>
                    <NeonCyanIcon type="pause" size={20} className="text-white" />
                    Pause
                  </>
                ) : (
                  <>
                    <NeonCyanIcon type="play" size={20} className="text-white" />
                    Preview
                  </>
                )}
              </button>

              <button
                onClick={handleSend}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-full font-medium transition-colors border border-green-400/30"
              >
                Send Voice
              </button>

              <button
                onClick={handleDiscard}
                className="px-4 py-3 bg-white/10 hover:bg-white/20 text-white rounded-full font-medium transition-colors border border-cyan-400/20"
              >
                Discard
              </button>
            </>
          )}
        </div>

        {audioBlob && (
          <p className="text-xs text-center text-white/60 mt-4">
            Preview your recording before sending
          </p>
        )}

        {isRecording && (
          <p className="text-xs text-center text-white/60 mt-4">
            Tap to stop recording
          </p>
        )}
      </div>
    </div>
  );
}
