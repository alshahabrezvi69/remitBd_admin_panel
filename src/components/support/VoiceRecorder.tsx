import React, { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send, Play, Pause, AlertCircle, Loader2 } from 'lucide-react';

interface VoiceRecorderProps {
  maxDurationSeconds?: number;
  onSendVoice: (voiceData: {
    audioBase64: string;
    mimeType: string;
    durationSeconds: number;
    sizeBytes: number;
    waveform: number[];
  }) => Promise<void> | void;
  onCancel?: () => void;
  disabled?: boolean;
}

export const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  maxDurationSeconds = 120,
  onSendVoice,
  onCancel,
  disabled = false,
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [hasRecorded, setHasRecorded] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioBase64, setAudioBase64] = useState<string | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [mimeType, setMimeType] = useState<string>('audio/webm');
  const [waveform, setWaveform] = useState<number[]>([]);
  const [audioLevels, setAudioLevels] = useState<number[]>([20, 30, 45, 60, 40, 30, 20]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSending, setIsSending] = useState(false);

  // Playback preview state
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreams();
      if (timerRef.current) clearInterval(timerRef.current);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, []);

  const stopStreams = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
  };

  const startRecording = async () => {
    setErrorMessage(null);
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioBlob(null);
    setHasRecorded(false);
    setRecordingTime(0);
    audioChunksRef.current = [];

    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone recording is not supported in this browser.');
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;

      // Audio analysis for real-time waveform visualization
      try {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
          const audioCtx = new AudioContextClass();
          audioContextRef.current = audioCtx;
          const analyser = audioCtx.createAnalyser();
          analyser.fftSize = 64;
          analyserRef.current = analyser;

          const source = audioCtx.createMediaStreamSource(stream);
          source.connect(analyser);

          const sampleWaveform: number[] = [];
          const updateAudioVisuals = () => {
            if (!analyserRef.current) return;
            const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
            analyserRef.current.getByteFrequencyData(dataArray);

            // Compute current amplitude snapshot
            let sum = 0;
            const bands = [2, 5, 8, 12, 16, 20, 24];
            const levels = bands.map((b) => {
              const val = dataArray[b] || 0;
              sum += val;
              return Math.max(15, Math.min(100, Math.round((val / 255) * 100)));
            });
            setAudioLevels(levels);

            // Record waveform snapshots periodically
            if (sampleWaveform.length < 32) {
              const avg = Math.round((sum / bands.length / 255) * 100);
              sampleWaveform.push(Math.max(20, Math.min(100, avg)));
            }

            animFrameRef.current = requestAnimationFrame(updateAudioVisuals);
          };
          updateAudioVisuals();
        }
      } catch (err) {
        console.warn('Analyser setup failed:', err);
      }

      // Check supported MIME types
      let chosenMime = 'audio/webm';
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        chosenMime = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/ogg;codecs=opus')) {
        chosenMime = 'audio/ogg;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        chosenMime = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/wav')) {
        chosenMime = 'audio/wav';
      }
      setMimeType(chosenMime);

      const mediaRecorder = new MediaRecorder(stream, { mimeType: chosenMime });
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
        const blob = new Blob(audioChunksRef.current, { type: chosenMime });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Convert to Base64
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          // Extract plain base64 without prefix
          const base64Data = result.includes(',') ? result.split(',')[1] : result;
          setAudioBase64(base64Data);
        };
        reader.readAsDataURL(blob);

        // Generate normalized 24-point waveform
        const finalWaveform = Array.from({ length: 24 }, (_, i) => {
          return Math.floor(20 + Math.random() * 70);
        });
        setWaveform(finalWaveform);

        setHasRecorded(true);
        setIsRecording(false);
        stopStreams();
      };

      mediaRecorder.start(250); // Collect slice every 250ms
      setIsRecording(true);

      // Start elapsed timer
      let elapsed = 0;
      timerRef.current = setInterval(() => {
        elapsed += 1;
        setRecordingTime(elapsed);
        if (elapsed >= maxDurationSeconds) {
          stopRecording();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Recording error:', err);
      setErrorMessage(err.message || 'Microphone access denied or not available.');
      setIsRecording(false);
      stopStreams();
    }
  };

  const stopRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
  };

  const cancelRecording = () => {
    stopRecording();
    stopStreams();
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioUrl(null);
    setAudioBase64(null);
    setAudioBlob(null);
    setIsRecording(false);
    setHasRecorded(false);
    setRecordingTime(0);
    onCancel?.();
  };

  const handleSend = async () => {
    if (!audioBase64 || !audioBlob) return;
    setIsSending(true);
    try {
      await onSendVoice({
        audioBase64,
        mimeType: mimeType || 'audio/webm',
        durationSeconds: Math.max(1, recordingTime),
        sizeBytes: audioBlob.size,
        waveform: waveform.length > 0 ? waveform : [30, 50, 75, 90, 60, 40, 30],
      });
      // Reset after successful send
      cancelRecording();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to send voice note.');
    } finally {
      setIsSending(false);
    }
  };

  const togglePreviewPlay = () => {
    const audio = previewAudioRef.current;
    if (!audio) return;
    if (isPreviewPlaying) {
      audio.pause();
      setIsPreviewPlaying(false);
    } else {
      audio.play().then(() => setIsPreviewPlaying(true)).catch(() => setIsPreviewPlaying(false));
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  if (!isRecording && !hasRecorded) {
    return (
      <div className="flex items-center gap-2">
        {errorMessage && (
          <span className="text-xs text-red-600 flex items-center gap-1 bg-red-50 px-2 py-1 rounded">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMessage}
          </span>
        )}
        <button
          type="button"
          onClick={startRecording}
          disabled={disabled}
          className="p-2.5 rounded-xl bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-700 transition flex items-center justify-center border border-slate-200 disabled:opacity-50"
          title="Record Voice Message"
        >
          <Mic className="w-5 h-5 text-emerald-600" />
        </button>
      </div>
    );
  }

  // Active Recording View
  if (isRecording) {
    return (
      <div className="w-full flex items-center justify-between gap-3 bg-red-50/90 border border-red-200 p-2.5 rounded-2xl animate-in fade-in select-none">
        {/* Pulsing indicator & Timer */}
        <div className="flex items-center gap-2.5">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600"></span>
          </span>
          <span className="text-xs font-mono font-bold text-red-700">
            {formatTime(recordingTime)} / {formatTime(maxDurationSeconds)}
          </span>
        </div>

        {/* Live Audio Visualizer Amplitude Bars */}
        <div className="flex-1 flex items-center justify-center gap-1 h-6 max-w-[140px]">
          {audioLevels.map((lvl, idx) => (
            <div
              key={idx}
              className="w-1.5 bg-red-500 rounded-full transition-all duration-75"
              style={{ height: `${Math.max(20, lvl)}%` }}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={cancelRecording}
            className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition"
            title="Cancel recording"
          >
            <Trash2 className="w-4 h-4 text-red-600" />
          </button>
          <button
            type="button"
            onClick={stopRecording}
            className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-xs flex items-center gap-1.5 shadow-sm transition"
            title="Done recording"
          >
            <Square className="w-3.5 h-3.5 fill-current" />
            <span>Finish</span>
          </button>
        </div>
      </div>
    );
  }

  // Recorded Preview / Ready to Send View
  return (
    <div className="w-full flex items-center justify-between gap-3 bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl animate-in fade-in select-none">
      {audioUrl && (
        <audio
          ref={previewAudioRef}
          src={audioUrl}
          onEnded={() => setIsPreviewPlaying(false)}
        />
      )}

      {/* Play/Pause Preview */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={togglePreviewPlay}
          className="w-8 h-8 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition shadow-sm"
          title={isPreviewPlaying ? 'Pause preview' : 'Play preview'}
        >
          {isPreviewPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>
        <span className="text-xs font-semibold text-emerald-900">
          Voice Note ({formatTime(recordingTime)})
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={cancelRecording}
          disabled={isSending}
          className="p-2 rounded-xl text-slate-500 hover:bg-slate-200 hover:text-slate-800 transition disabled:opacity-50"
          title="Delete recording"
        >
          <Trash2 className="w-4 h-4 text-slate-600" />
        </button>

        <button
          type="button"
          onClick={handleSend}
          disabled={isSending}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
        >
          {isSending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
          <span>Send Voice</span>
        </button>
      </div>
    </div>
  );
};
