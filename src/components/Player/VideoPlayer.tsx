// src/components/Player/VideoPlayer.tsx
import React, { useEffect, useRef, useMemo, useState, forwardRef, useImperativeHandle } from 'react';
import { Box, Paper, IconButton, Typography } from '@mui/material';
import { Play, Pause, SkipBack, SkipForward } from 'lucide-react';
import { VirtualTimeEngine } from '../../core/VirtualTimeEngine';
import { Timeline } from './Timeline/Controls/Timeline';
import type { VideoDataPayload, Segment, Tag } from '../../types';

interface VideoPlayerProps {
  data: VideoDataPayload;
}

export interface VideoPlayerRef {
  play: () => void;
  pause: () => void;
  next: () => void;
  prev: () => void;
  getCurrentTime: () => number; // NUEVO
}

export const VideoPlayer = forwardRef<VideoPlayerRef, VideoPlayerProps>(({ data }, ref) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [virtualProgress, setVirtualProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [virtualDurationDisplay, setVirtualDurationDisplay] = useState(0);

  const engine = useMemo(() => {
    return new VirtualTimeEngine(data.segments, data.tags, 0);
  }, [data]);

  const visibleBoundaries = useMemo(() => {
    const boundaries = new Set<number>();
    const tagMap = new Map(data.tags.map((t: Tag) => [t.id, t]));
    
    data.segments.forEach((s: Segment) => {
      if (!tagMap.get(s.tagId)?.isHidden) {
        boundaries.add(s.startReal);
        boundaries.add(s.endReal);
      }
    });
    return Array.from(boundaries).sort((a, b) => a - b);
  }, [data]);

  const handleTimeUpdate = () => {
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
    const nextTarget = visibleBoundaries.find(b => b > currentTime + 0.5);
    if (nextTarget !== undefined) {
      videoRef.current.currentTime = engine.getValidRealTime(nextTarget);
    }
  };

  const internalPrev = () => {
    if (!videoRef.current) return;
    const currentTime = videoRef.current.currentTime;
    const prevTarget = [...visibleBoundaries].reverse().find(b => b < currentTime - 0.5);
    if (prevTarget !== undefined) {
      videoRef.current.currentTime = engine.getValidRealTime(prevTarget);
    } else {
      videoRef.current.currentTime = 0;
    }
  };

  useImperativeHandle(ref, () => ({
    play: internalPlay,
    pause: internalPause,
    next: internalNext,
    prev: internalPrev,
    getCurrentTime: () => videoRef.current?.currentTime || 0 // NUEVO
  }));

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      engine.setRealDuration(videoRef.current.duration);
      setVirtualDurationDisplay(engine.getVirtualDuration());
    }
  };

  const handleSeek = (virtualPercentage: number) => {
    if (!videoRef.current) return;
    const targetVirtualTime = engine.getVirtualDuration() * virtualPercentage;
    const targetRealTime = engine.virtualToReal(targetVirtualTime);
    videoRef.current.currentTime = engine.getValidRealTime(targetRealTime); 
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.code === 'Space') {
      e.preventDefault();
      isPlaying ? internalPause() : internalPlay();
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

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Paper 
      elevation={3} 
      ref={containerRef}
      tabIndex={0} 
      onKeyDown={handleKeyDown}
      sx={{ 
        width: '100%', 
        maxWidth: 900, 
        mx: 'auto', 
        p: 2, 
        outline: 'none',
        borderRadius: 2,
        backgroundColor: 'background.paper'
      }}
    >
      {/* Contenedor del Video */}
      <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', backgroundColor: '#000' }}>
        <video
          ref={videoRef}
          src={data.videoUrl}
          width="100%"
          onLoadedMetadata={handleLoadedMetadata}
          controls={false} 
          style={{ display: 'block', cursor: 'pointer' }}
          onClick={() => isPlaying ? internalPause() : internalPlay()}
        />
        {/* Tiempo Virtual Superpuesto */}
        <Typography 
          variant="h5" 
          sx={{
            position: 'absolute',
            bottom: 16,
            right: 16,
            color: 'white',
            fontWeight: 'bold',
            textShadow: '0px 2px 4px rgba(0,0,0,0.8)'
          }}
        >
          {formatTime(virtualDurationDisplay)} min
        </Typography>
      </Box>

      {/* Controles de Reproducción Minimalistas */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 2, mt: 2 }}>
        <IconButton onClick={internalPrev} color="primary" size="large">
          <SkipBack size={24} />
        </IconButton>
        <IconButton onClick={() => isPlaying ? internalPause() : internalPlay()} color="primary" sx={{ transform: 'scale(1.2)' }}>
          {isPlaying ? <Pause size={32} /> : <Play size={32} />}
        </IconButton>
        <IconButton onClick={internalNext} color="primary" size="large">
          <SkipForward size={24} />
        </IconButton>
      </Box>
      
      {/* Timeline */}
      <Timeline 
        engine={engine}
        segments={data.segments}
        tags={data.tags}
        virtualProgress={virtualProgress}
        onSeek={handleSeek}
      />
      
      <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 3 }}>
        <strong>Atajos:</strong> <code>Espacio</code> (Play/Pause) • <code>Flechas ⬅️ ➡️</code> (Saltar Etiquetas)
      </Typography>
    </Paper>
  );
});