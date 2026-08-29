import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, AlertCircle, RotateCcw } from 'lucide-react';

interface VoiceAudioPlayerProps {
  mediaUrl: string;
  duration?: number;
  waveform?: number[];
  senderType?: 'CUSTOMER' | 'ADMIN' | 'SYSTEM';
  onPlayStart?: () => void;
}

export const VoiceAudioPlayer: React.FC<VoiceAudioPlayerProps> = ({
  mediaUrl,
  duration = 0,
  waveform,
  senderType = 'CUSTOMER',
  onPlayStart,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [hasError, setHasError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Generate fallback visual bars if none provided
  const bars = waveform && waveform.length > 0 
    ? waveform 
    : [25, 40, 65, 80, 50, 90, 75, 40, 60, 85, 95, 70, 45, 30, 60, 75, 50, 35, 20];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setAudioDuration(audio.duration);
      }
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    const handleError = () => {
      setHasError(true);
      setIsLoading(false);
      setIsPlaying(false);
    };

    const handleWaiting = () => setIsLoading(true);
    const handleCanPlay = () => setIsLoading(false);

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [mediaUrl]);

  const togglePlay = () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (isPlaying) {
      audio.pause();
      setIsPlaying(false);
    } else {
      onPlayStart?.();
      audio.play().then(() => {
        setIsPlaying(true);
        setHasError(false);
      }).catch((err) => {
        console.warn('Audio playback error:', err);
        setHasError(true);
      });
    }
  };

  const handleSeek = (index: number) => {
    const audio = audioRef.current;
    if (!audio || audioDuration <= 0) return;
    const progress = index / bars.length;
    const newTime = progress * audioDuration;
    audio.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const toggleSpeed = () => {
    const speeds = [1, 1.5, 2];
    const nextIdx = (speeds.indexOf(playbackRate) + 1) % speeds.length;
    const nextRate = speeds[nextIdx];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = audioDuration > 0 ? (currentTime / audioDuration) * 100 : 0;
  const isOutgoing = senderType === 'CUSTOMER';

  return (
    <div className={`flex flex-col gap-1.5 p-3 rounded-2xl min-w-[240px] sm:min-w-[280px] max-w-[340px] select-none ${
      isOutgoing 
        ? 'bg-emerald-700 text-white' 
        : 'bg-slate-800 text-slate-100'
    }`}>
      <audio ref={audioRef} src={mediaUrl} preload="metadata" />

      <div className="flex items-center gap-3">
        {/* Play/Pause Button */}
        <button
          type="button"
          onClick={togglePlay}
          disabled={hasError}
          className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform active:scale-95 shrink-0 ${
            isOutgoing
              ? 'bg-white text-emerald-800 hover:bg-emerald-50 shadow-md'
              : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-md'
          }`}
          title={isPlaying ? 'Pause' : 'Play voice message'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-current" />
          ) : (
            <Play className="w-5 h-5 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Visualization Bars */}
        <div className="flex-1 flex items-center gap-0.5 sm:gap-1 h-8 cursor-pointer group py-1" onClick={(e) => {
          const rect = e.currentTarget.getBoundingClientRect();
          const clickX = e.clientX - rect.left;
          const ratio = Math.max(0, Math.min(1, clickX / rect.width));
          if (audioRef.current && audioDuration > 0) {
            audioRef.current.currentTime = ratio * audioDuration;
            setCurrentTime(ratio * audioDuration);
          }
        }}>
          {bars.map((height, idx) => {
            const barProgress = (idx / bars.length) * 100;
            const isPlayed = barProgress <= progressPercent;
            const normalizedHeight = Math.max(15, Math.min(100, height));

            return (
              <div
                key={idx}
                className={`flex-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isOutgoing
                      ? 'bg-white'
                      : 'bg-emerald-400'
                    : isOutgoing
                      ? 'bg-emerald-500/60 group-hover:bg-emerald-400/80'
                      : 'bg-slate-600 group-hover:bg-slate-500'
                }`}
                style={{
                  height: `${normalizedHeight}%`,
                  minHeight: '4px',
                }}
              />
            );
          })}
        </div>

        {/* Playback speed toggle */}
        <button
          type="button"
          onClick={toggleSpeed}
          className={`text-xs font-semibold px-1.5 py-0.5 rounded transition ${
            isOutgoing
              ? 'bg-emerald-800/80 hover:bg-emerald-900 text-emerald-100'
              : 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          }`}
          title="Playback speed"
        >
          {playbackRate}x
        </button>
      </div>

      {/* Footer Time & Status */}
      <div className="flex items-center justify-between text-[11px] font-medium px-1 opacity-90">
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 opacity-75" />
          <span>{isPlaying || currentTime > 0 ? formatTime(currentTime) : formatTime(audioDuration || duration)}</span>
        </span>
        {hasError ? (
          <span className="text-red-300 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> Audio unavailable
          </span>
        ) : (
          <span className="opacity-75">{formatTime(audioDuration || duration)}</span>
        )}
      </div>
    </div>
  );
};
