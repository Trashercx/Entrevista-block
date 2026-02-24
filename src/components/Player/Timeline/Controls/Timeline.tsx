// src/components/Player/Timeline/Timeline.tsx
import React, { useMemo } from 'react';
import { VirtualTimeEngine } from '../../../../core/VirtualTimeEngine';
import type { Segment, Tag } from '../../../../types';

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
    
    // 1. Separar etiquetas visibles de descartables (basura)
    const visibles = segments.filter(s => !tagMap.get(s.tagId)?.isHidden);
    const hiddens = segments.filter(s => tagMap.get(s.tagId)?.isHidden);

    // 2. Procesar visibles a tiempo virtual
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

    // 3. Algoritmo de colisiones (Multipista)
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

    // 4. Marcadores de zonas ocultas
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

  const TRACK_HEIGHT = 40;

  return (
    <div 
      style={{ 
        position: 'relative', 
        width: '100%', 
        height: `${totalTracks * TRACK_HEIGHT}px`, 
        backgroundColor: '#1e1e1e', 
        borderRadius: '8px', 
        marginTop: '15px',
        cursor: 'pointer',
        overflow: 'hidden',
        border: '1px solid #333'
      }}
      onClick={handleTimelineClick}
    >
      {/* Barra de progreso actual */}
      <div 
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: `${virtualProgress}%`,
          backgroundColor: 'rgba(255, 255, 255, 0.15)',
          borderRight: '2px solid white',
          zIndex: 10,
          pointerEvents: 'none'
        }}
      />

      {/* Marcadores de salto invisible (Líneas rojas punteadas) */}
      {hiddenMarkers.map((marker, i) => (
        <div key={`hidden-${i}`} style={{
          position: 'absolute',
          left: `${marker.leftPct}%`,
          top: 0,
          bottom: 0,
          width: '2px',
          backgroundColor: 'transparent',
          borderRight: '2px dashed #ff4444',
          zIndex: 5
        }}>
          <span style={{ 
            position: 'absolute', 
            top: '2px', 
            left: '4px', 
            color: '#ff4444', 
            fontSize: '10px',
            fontWeight: 'bold'
          }}>
            Salto ({marker.durationReal}s)
          </span>
        </div>
      ))}

      {/* Pistas Visibles Apiladas */}
      {visibleTracks.map((seg, i) => (
        <div key={`vis-${i}`} style={{
          position: 'absolute',
          left: `${seg.leftPct}%`,
          width: `${seg.widthPct}%`,
          top: `${seg.trackIndex * TRACK_HEIGHT + 4}px`,
          height: `${TRACK_HEIGHT - 8}px`,
          backgroundColor: seg.tag.color,
          borderRadius: '4px',
          opacity: 0.85,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#000',
          fontSize: '12px',
          fontWeight: 'bold',
          padding: '0 4px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          zIndex: 6,
          boxShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          {seg.tag.name}
        </div>
      ))}
    </div>
  );
};