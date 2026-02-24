// src/components/Player/VideoPlayer.tsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VirtualTimeEngine } from '../../../../core/VirtualTimeEngine';
import type { VideoDataPayload } from '../../../../types';

interface VideoPlayerProps {
  data: VideoDataPayload;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ data }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number>(undefined);
  
  const [virtualProgress, setVirtualProgress] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);

  const engine = useMemo(() => {
    return new VirtualTimeEngine(data.segments, data.tags, 0);
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

  const onPlay = () => {
    setIsPlaying(true);
    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const onPause = () => {
    setIsPlaying(false);
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      engine['realDuration'] = videoRef.current.duration;
      engine['calculateVirtualDuration']();
    }
  };

  // Limpieza del hook
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {/* Etiqueta nativa requerida por el PO */}
      <video
        ref={videoRef}
        src={data.videoUrl}
        width="100%"
        onPlay={onPlay}
        onPause={onPause}
        onLoadedMetadata={handleLoadedMetadata}
        controls={false} // Suprimimos controles nativos como pidió el PO
        style={{ borderRadius: '8px', backgroundColor: '#000' }}
      />
      
      {/* UI Temporal de progreso para verificar que la matemática funciona */}
      <div style={{ marginTop: '10px', background: '#333', height: '10px', borderRadius: '5px' }}>
        <div 
          style={{ 
            width: `${virtualProgress}%`, 
            background: '#4caf50', 
            height: '100%', 
            borderRadius: '5px',
            transition: 'width 0.1s linear'
          }} 
        />
      </div>
      
      <div style={{ marginTop: '10px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
        <button onClick={() => videoRef.current?.play()}>Play</button>
        <button onClick={() => videoRef.current?.pause()}>Pause</button>
      </div>
    </div>
  );
};