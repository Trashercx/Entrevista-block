// src/components/Player/Timeline/Controls/VideoPlayer.tsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VirtualTimeEngine } from '../../core/VirtualTimeEngine';
import { Timeline } from './Timeline/Controls/Timeline';
import type { VideoDataPayload, Segment, Tag } from '../../types';

interface VideoPlayerProps {
  data: VideoDataPayload;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ data }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [virtualProgress, setVirtualProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const engine = useMemo(() => {
    return new VirtualTimeEngine(data.segments, data.tags, 0);
  }, [data]);

  // Extraer límites de las etiquetas visibles para la navegación por teclado
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
    
    // 1. Validar saltos invisibles
    const validTime = engine.getValidRealTime(currentRealTime);
    if (validTime !== currentRealTime) {
      videoRef.current.currentTime = validTime; 
    }

    // 2. Calcular progreso virtual
    const vTime = engine.realToVirtual(validTime);
    const vDuration = engine.getVirtualDuration();
    if (vDuration > 0) {
      setVirtualProgress((vTime / vDuration) * 100);
    }

    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const onPlay = () => {
    setIsPlaying(true);
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(handleTimeUpdate);
    }
  };

  const onPause = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      engine.setRealDuration(videoRef.current.duration);
    }
  };

  const handleSeek = (virtualPercentage: number) => {
    if (!videoRef.current) return;
    const targetVirtualTime = engine.getVirtualDuration() * virtualPercentage;
    const targetRealTime = engine.virtualToReal(targetVirtualTime);
    // Asegurar que el click manual no caiga en un segmento oculto
    videoRef.current.currentTime = engine.getValidRealTime(targetRealTime); 
  };

  // Navegación Inteligente (Teclado)
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (!videoRef.current) return;
    
    const currentTime = videoRef.current.currentTime;

    if (e.code === 'Space') {
      e.preventDefault(); // Previene el scroll del navegador
      if (videoRef.current.paused) {
        videoRef.current.play();
      } else {
        videoRef.current.pause();
      }
    } else if (e.code === 'ArrowRight') {
      e.preventDefault();
      // Busca el próximo punto mayor al tiempo actual + 0.5s margen
      const nextTarget = visibleBoundaries.find(b => b > currentTime + 0.5);
      if (nextTarget !== undefined) {
        videoRef.current.currentTime = engine.getValidRealTime(nextTarget);
      }
    } else if (e.code === 'ArrowLeft') {
      e.preventDefault();
      // Busca el punto anterior menor al tiempo actual - 0.5s margen
      const prevTarget = [...visibleBoundaries].reverse().find(b => b < currentTime - 0.5);
      if (prevTarget !== undefined) {
        videoRef.current.currentTime = engine.getValidRealTime(prevTarget);
      } else {
        videoRef.current.currentTime = 0; // Regresa al inicio si no hay más atrás
      }
    }
  };

  useEffect(() => {
    // Para que el div capture el teclado sin tener que hacer click en él primero
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
      <video
        ref={videoRef}
        src={data.videoUrl}
        width="100%"
        onPlay={onPlay}
        onPause={onPause}
        onLoadedMetadata={handleLoadedMetadata}
        controls={false} 
        style={{ borderRadius: '8px', backgroundColor: '#000', cursor: 'pointer' }}
        onClick={() => isPlaying ? videoRef.current?.pause() : videoRef.current?.play()}
      />
      
      <Timeline 
        engine={engine}
        segments={data.segments}
        tags={data.tags}
        virtualProgress={virtualProgress}
        onSeek={handleSeek}
      />
      
      <div style={{ marginTop: '15px', color: '#666', fontSize: '14px', textAlign: 'center' }}>
        <strong>Atajos de teclado:</strong> <code>Espaciadora</code> (Play/Pause) • <code>Flechas ⬅️ ➡️</code> (Saltar entre etiquetas)
      </div>
    </div>
  );
};