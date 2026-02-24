// src/components/Player/Timeline/Controls/VideoPlayer.tsx
import React, { useEffect, useRef, useMemo, useState } from 'react';
import { VirtualTimeEngine } from '../../../../core/VirtualTimeEngine';
import type { VideoDataPayload } from '../../../../types';

interface VideoPlayerProps {
  data: VideoDataPayload;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ data }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const animationRef = useRef<number | undefined>(undefined);
  
  const [virtualProgress, setVirtualProgress] = useState(0);

  const engine = useMemo(() => {
    return new VirtualTimeEngine(data.segments, data.tags, 0);
  }, [data]);

  const handleTimeUpdate = () => {
    if (!videoRef.current) return;

    const currentRealTime = videoRef.current.currentTime;
    
    // 1. Validar saltos invisibles (Zonas basura)
    const validTime = engine.getValidRealTime(currentRealTime);
    if (validTime !== currentRealTime) {
      videoRef.current.currentTime = validTime; 
    }

    // 2. Calcular progreso virtual para la barra (0 a 100%)
    const vTime = engine.realToVirtual(validTime);
    const vDuration = engine.getVirtualDuration();
    if (vDuration > 0) {
      setVirtualProgress((vTime / vDuration) * 100);
    }

    animationRef.current = requestAnimationFrame(handleTimeUpdate);
  };

  const onPlay = () => {
    if (!animationRef.current) {
      animationRef.current = requestAnimationFrame(handleTimeUpdate);
    }
  };

  const onPause = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = undefined;
    }
  };

  const handleLoadedMetadata = () => {
    if (videoRef.current) {
      // Uso correcto de POO sin alterar propiedades privadas
      engine.setRealDuration(videoRef.current.duration);
    }
  };

  // Limpieza del hook al desmontar
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  return (
    <div style={{ width: '100%', maxWidth: '800px', margin: '0 auto', position: 'relative' }}>
      {/* Etiqueta nativa requerida por el PO sin controles HTML5 */}
      <video
        ref={videoRef}
        src={data.videoUrl}
        width="100%"
        onPlay={onPlay}
        onPause={onPause}
        onLoadedMetadata={handleLoadedMetadata}
        controls={false}
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