// src/components/Player/Timeline/Timeline.tsx
import React, { useMemo } from 'react';
import { VirtualTimeEngine } from '../../../../core/VirtualTimeEngine';
import type { Segment, Tag } from '../../../../types';

const formatTime = (totalSeconds: number) => {
  const m = Math.floor(totalSeconds / 60);
  const s = Math.floor(totalSeconds % 60);
  return `${m}:${s.toString().padStart(2, '0')} min`;
};

interface TimelineProps {
  engine: VirtualTimeEngine;
  segments: Segment[];
  tags: Tag[];
  virtualProgress: number; // 0 a 100
  onSeek: (virtualPercentage: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  engine, segments, tags, virtualProgress, onSeek 
}) => {
  const virtualDuration = engine.getVirtualDuration();

  const { visibleTracks, hiddenMarkers, totalTracks } = useMemo(() => {
    if (virtualDuration === 0) return { visibleTracks: [], hiddenMarkers: [], totalTracks: 1 };

    const tagMap = new Map(tags.map(t => [t.id, t]));
    
    const visibles = segments.filter(s => !tagMap.get(s.tagId)?.isHidden);
    const hiddens = segments.filter(s => tagMap.get(s.tagId)?.isHidden);

    const processedVisibles = visibles.map(s => {
      const tag = tagMap.get(s.tagId)!;
      const startV = engine.realToVirtual(s.startReal);
      const endV = engine.realToVirtual(s.endReal);
      return {
        ...s,
        tag,
        startV,
        endV,
        leftPct: (startV / virtualDuration) * 100,
        widthPct: ((endV - startV) / virtualDuration) * 100
      };
    }).sort((a, b) => a.startV - b.startV);

    const tracks: number[] = [];
    const visibleTracks = processedVisibles.map(seg => {
      let trackIndex = -1;
      for (let i = 0; i < tracks.length; i++) {
        if (tracks[i] <= seg.startV) {
          tracks[i] = seg.endV;
          trackIndex = i;
          break;
        }
      }
      if (trackIndex === -1) {
        trackIndex = tracks.length;
        tracks.push(seg.endV);
      }
      return { ...seg, trackIndex };
    });

    const hiddenMarkers = hiddens.map(s => {
      const pointV = engine.realToVirtual(s.startReal);
      return {
        ...s,
        leftPct: (pointV / virtualDuration) * 100,
        durationReal: s.endReal - s.startReal
      };
    });

    return { visibleTracks, hiddenMarkers, totalTracks: Math.max(1, tracks.length) };
  }, [segments, tags, engine, virtualDuration]);

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = clickX / rect.width;
    onSeek(percentage);
  };

  const TRACK_HEIGHT = 60; // Más alto para dar espacio al texto debajo de la línea

  return (
    <div style={{ position: 'relative', marginTop: '25px' }}>
      {/* Indicador de Tiempo Real arriba a la derecha */}
      <div style={{ position: 'absolute', top: '-25px', right: 0, color: '#fff', fontSize: '14px' }}>
        {formatTime(engine['realDuration'] as number)} ➔
      </div>

      <div 
        style={{ 
          position: 'relative', 
          width: '100%', 
          height: `${totalTracks * TRACK_HEIGHT}px`, 
          backgroundColor: '#80d8e5', // Celeste de la imagen
          cursor: 'pointer',
          overflow: 'hidden',
        }}
        onClick={handleTimelineClick}
      >
        {/* Pistas Visibles Apiladas (Estilo Línea + Texto) */}
        {visibleTracks.map((seg, i) => (
          <div key={`vis-${i}`} style={{
            position: 'absolute',
            left: `${seg.leftPct}%`,
            width: `${seg.widthPct}%`,
            top: `${seg.trackIndex * TRACK_HEIGHT + 10}px`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
            zIndex: 6,
          }}>
            {/* La línea de color */}
            <div style={{
              width: '80%', // No ocupa el 100% para dejar un pequeño margen visual como en la imagen
              height: '6px',
              backgroundColor: seg.tag.color,
              margin: '0 auto'
            }} />
            {/* El texto debajo */}
            <span style={{ 
              color: '#fff', 
              fontSize: '14px',
              marginTop: '4px',
              marginLeft: '10%',
              whiteSpace: 'nowrap'
            }}>
              {seg.tag.name}
            </span>
          </div>
        ))}

        {/* Zonas Descartables (Línea Gris Oscura) */}
        {hiddenMarkers.map((marker, i) => (
          <div key={`hidden-${i}`} style={{
            position: 'absolute',
            left: `${marker.leftPct}%`,
            top: '10px',
            width: '20%', // Simulando la barra gris de descartable
            zIndex: 5,
            display: 'flex',
            flexDirection: 'column',
          }}>
             <span style={{ color: '#fff', fontSize: '12px', marginBottom: '2px' }}>
              {marker.durationReal} sec
            </span>
            <div style={{
              width: '100%',
              height: '6px',
              backgroundColor: '#424242',
            }} />
            <span style={{ color: '#fff', fontSize: '14px', marginTop: '4px' }}>
              Descartable
            </span>
          </div>
        ))}

        {/* Cursor (Playhead) Azul vertical */}
        <div 
          style={{
            position: 'absolute',
            left: `${virtualProgress}%`,
            top: 0,
            bottom: 0,
            width: '2px',
            backgroundColor: '#0000ff', // Línea azul de la captura
            zIndex: 10,
            pointerEvents: 'none'
          }}
        />
      </div>
    </div>
  );
};