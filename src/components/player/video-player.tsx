"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  RotateCcw,
  SkipForward,
} from "lucide-react";
import { cn, toPersianDigits } from "@/lib/utils";

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onEnded?: () => void;
  onProgress?: (seconds: number) => void;
}

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function VideoPlayer({ src, poster, onEnded, onProgress }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [showBigPlay, setShowBigPlay] = useState(true);

  // Auto-hide controls
  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    if (playing) {
      hideTimerRef.current = setTimeout(() => setShowControls(false), 3000);
    }
  }, [playing]);

  useEffect(() => {
    if (!playing) setShowControls(true);
    else resetHideTimer();
  }, [playing, resetHideTimer]);

  // Progress reporting
  useEffect(() => {
    if (onProgress && currentTime > 0 && Math.floor(currentTime) % 10 === 0) {
      onProgress(Math.floor(currentTime));
    }
  }, [currentTime, onProgress]);

  function togglePlay() {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play();
      setPlaying(true);
      setShowBigPlay(false);
    } else {
      v.pause();
      setPlaying(false);
    }
    resetHideTimer();
  }

  function toggleMute() {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setMuted(v.muted);
  }

  function handleTimeUpdate() {
    const v = videoRef.current;
    if (!v) return;
    setCurrentTime(v.currentTime);
    if (v.buffered.length > 0) {
      setBuffered(v.buffered.end(v.buffered.length - 1));
    }
  }

  function handleSeek(e: React.MouseEvent | React.TouchEvent) {
    const v = videoRef.current;
    const bar = progressRef.current;
    if (!v || !bar) return;

    const rect = bar.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    // RTL: calculate from right
    const ratio = (clientX - rect.left) / rect.width;
    const clamped = Math.max(0, Math.min(1, ratio));
    v.currentTime = clamped * v.duration;
    setCurrentTime(v.currentTime);
  }

  function skip(seconds: number) {
    const v = videoRef.current;
    if (!v) return;
    v.currentTime = Math.min(v.duration, Math.max(0, v.currentTime + seconds));
  }

  function handleFullscreen() {
    const el = containerRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      el.requestFullscreen();
    }
  }

  function handleEnded() {
    setPlaying(false);
    setShowControls(true);
    setShowBigPlay(true);
    onEnded?.();
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferProgress = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      className="relative bg-black aspect-video select-none group rounded-2xl overflow-hidden"
      onClick={togglePlay}
      onMouseMove={resetHideTimer}
      onTouchStart={resetHideTimer}
    >
      <video
        ref={videoRef}
        src={src}
        poster={poster}
        playsInline
        preload="metadata"
        className="w-full h-full"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => setDuration(videoRef.current?.duration || 0)}
        onEnded={handleEnded}
      />

      {/* Big Play Button (initial) */}
      {showBigPlay && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
            <Play className="w-7 h-7 text-white mr-[-2px]" fill="white" />
          </div>
        </div>
      )}

      {/* Controls Overlay */}
      <div
        className={cn(
          "absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent pt-12 pb-3 px-4 transition-opacity duration-300",
          showControls && !showBigPlay ? "opacity-100" : "opacity-0 pointer-events-none"
        )}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Progress Bar */}
        <div
          ref={progressRef}
          className="h-6 flex items-center cursor-pointer mb-2"
          onClick={handleSeek}
        >
          <div className="w-full h-1 bg-white/20 rounded-full relative">
            {/* Buffered */}
            <div
              className="absolute top-0 left-0 h-full bg-white/30 rounded-full"
              style={{ width: `${bufferProgress}%` }}
            />
            {/* Progress */}
            <div
              className="absolute top-0 left-0 h-full bg-primary rounded-full"
              style={{ width: `${progress}%` }}
            />
            {/* Thumb */}
            <div
              className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-primary rounded-full shadow"
              style={{ left: `calc(${progress}% - 6px)` }}
            />
          </div>
        </div>

        {/* Bottom Controls */}
        <div className="flex items-center justify-between" dir="ltr">
          <div className="flex items-center gap-3">
            <button onClick={togglePlay} className="text-white">
              {playing ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" fill="white" />}
            </button>
            <button onClick={() => skip(10)} className="text-white/70">
              <SkipForward className="w-4 h-4" />
            </button>
            <button onClick={toggleMute} className="text-white/70">
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <span className="text-white/70 text-xs font-mono">
              {formatTime(currentTime)} / {formatTime(duration)}
            </span>
          </div>
          <button onClick={handleFullscreen} className="text-white/70">
            <Maximize className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
