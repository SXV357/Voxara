import { useEffect, useRef, useState } from 'react';

export type RecorderStatus = 'idle' | 'recording' | 'paused' | 'stopped';
export type RecorderError =
  | 'permission-denied'
  | 'no-device'
  | 'unsupported'
  | 'unknown';

interface UseAudioRecorderResult {
  status: RecorderStatus;
  error: RecorderError | null;
  elapsedMs: number;
  stream: MediaStream | null;
  audioBlob: Blob | null;
  audioUrl: string | null;
  start: () => Promise<void>;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  reset: () => void;
}

export function useAudioRecorder(): UseAudioRecorderResult {
  const [status, setStatus] = useState<RecorderStatus>('idle');
  const [error, setError] = useState<RecorderError | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef(0);
  const pausedAtRef = useRef(0);

  useEffect(() => {
    if (status !== 'recording') return;
    const id = setInterval(() => {
      setElapsedMs(Date.now() - startTimeRef.current);
    }, 100);
    return () => clearInterval(id);
  }, [status]);

  useEffect(() => {
    return () => {
      recorderRef.current?.stream.getTracks().forEach((track) => track.stop());
    };
  }, []);

  async function start() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('unsupported');
      return;
    }

    setError(null);
    try {
      const userStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mimeType = MediaRecorder.isTypeSupported('audio/webm')
        ? 'audio/webm'
        : undefined;
      const recorder = new MediaRecorder(
        userStream,
        mimeType ? { mimeType } : undefined,
      );

      chunksRef.current = [];
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        userStream.getTracks().forEach((track) => track.stop());
        setStream(null);
      };

      recorderRef.current = recorder;
      recorder.start();
      startTimeRef.current = Date.now();
      setElapsedMs(0);
      setStream(userStream);
      setStatus('recording');
    } catch (err) {
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setError('permission-denied');
      } else if (err instanceof DOMException && err.name === 'NotFoundError') {
        setError('no-device');
      } else {
        setError('unknown');
      }
    }
  }

  function pause() {
    if (status !== 'recording') return;
    recorderRef.current?.pause();
    pausedAtRef.current = Date.now();
    setStatus('paused');
  }

  function resume() {
    if (status !== 'paused') return;
    recorderRef.current?.resume();
    startTimeRef.current += Date.now() - pausedAtRef.current;
    setStatus('recording');
  }

  function stop() {
    if (status !== 'recording' && status !== 'paused') return;
    recorderRef.current?.stop();
    setStatus('stopped');
  }

  function reset() {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    recorderRef.current = null;
    chunksRef.current = [];
    setAudioBlob(null);
    setAudioUrl(null);
    setElapsedMs(0);
    setError(null);
    setStatus('idle');
  }

  return {
    status,
    error,
    elapsedMs,
    stream,
    audioBlob,
    audioUrl,
    start,
    pause,
    resume,
    stop,
    reset,
  };
}
