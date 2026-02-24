// src/components/Player/VideoPlayer.tsx
import React, { useEffect, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { VirtualTimeEngine } from '../../core/VirtualTimeEngine';
import { Timeline } from './Timeline/Controls/Timeline';
import type { VideoDataPayload } from '../../types';

interface VideoPlayerProps {
  data: VideoDataPayload;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ data }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  const [virtualProgress, setVirtualProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [activeSegmentId, setActiveSegmentId] = useState<string | null>(null);

  const engine = useMemo(() => new VirtualTimeEngine(data.segments, data.tags, 0), [data]);

  const cutPoints = useMemo(
    () => engine.getValidCutPoints(data.segments, data.tags),
    [data.segments, data.tags, engine]
  );

  const syncPlaybackState = () => {
    if (!videoRef.current) return;

    const currentRealTime = videoRef.current.currentTime;
    const validTime = engine.getValidRealTime(currentRealTime);

    if (validTime !== currentRealTime) {
      videoRef.current.currentTime = validTime;
    }

    const vTime = engine.realToVirtual(validTime);
    const vDuration = engine.getVirtualDuration();
    if (vDuration > 0) {
      setVirtualProgress((vTime / vDuration) * 100);
    }

    const activeSegment = engine.getActiveVisibleSegment(data.segments, data.tags, validTime);
    setActiveSegmentId(activeSegment?.id ?? null);
  };

  const handleTimeUpdate = () => {
    syncPlaybackState();
    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const internalPlay = () => {
    setIsPlaying(true);
    videoRef.current?.play();
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(handleTimeUpdate);
    }
  };

  const internalPause = () => {
    setIsPlaying(false);
    videoRef.current?.pause();
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  const internalNext = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const nextTarget = cutPoints.find((point) => point > currentTime + 0.2);
    if (nextTarget !== undefined) {
      videoRef.current.currentTime = nextTarget;
      syncPlaybackState();
    }
  };

  const internalPrev = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const prevTarget = [...cutPoints].reverse().find((point) => point < currentTime - 0.2);
    videoRef.current.currentTime = prevTarget ?? 0;
    syncPlaybackState();
  };

  useImperativeHandle(ref, () => ({
    play: internalPlay,
    pause: internalPause,
    next: internalNext,
    prev: internalPrev,
  }));

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      engine.setRealDuration(videoRef.current.duration);
      syncPlaybackState();
    }
  };

  const handleSeek = (virtualPercentage: number) => {
    if (!videoRef.current) return;
    const targetVirtualTime = engine.getVirtualDuration() * virtualPercentage;
    const targetRealTime = engine.virtualToReal(targetVirtualTime);
    videoRef.current.currentTime = engine.getValidRealTime(targetRealTime);
    syncPlaybackState();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Space') {
      e.preventDefault();
      if (isPlaying) internalPause();
      else internalPlay();
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      internalNext();
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      internalPrev();
    }
  };

  useEffect(() => {
    if (containerRef.current) containerRef.current.focus();
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative', outline: 'none' }}
    >
      <div style={{ position: 'relative' }}>
        <video
          ref={videoRef}
          src={data.videoUrl}
          width="100%"
          onLoadedMetadata={handleLoadedMetadata}
          controls={false}
          style={{ backgroundColor: '#ccc', cursor: 'pointer', display: 'block' }}
          onClick={() => (isPlaying ? internalPause() : internalPlay())}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10px',
            right: '15px',
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: '24px',
            textShadow: '1px 1px 2px rgba(0,0,0,0.8)',
          }}
        >
          {Math.floor(engine.getVirtualDuration() / 60)}:
          {Math.floor(engine.getVirtualDuration() % 60)
            .toString()
            .padStart(2, '0')}{' '}
          min
        </div>
      </div>

      <Timeline
        engine={engine}
        segments={data.segments}
        tags={data.tags}
        virtualProgress={virtualProgress}
        onSeek={handleSeek}
        activeSegmentId={activeSegmentId}
      />

      <div style={{ marginTop: '15px', color: '#666', fontSize: '14px', textAlign: 'center' }}>
        <strong>Atajos:</strong> <code>Espacio</code> (Play/Pause) • <code>Flechas ⬅️ ➡️</code> (Saltar cortes válidos)
      </div>
    </div>
  );
});
