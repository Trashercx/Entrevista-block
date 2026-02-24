// src/components/Player/Timeline/Controls/Timeline.tsx
import React, { useMemo } from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import { VirtualTimeEngine } from '../../../../core/VirtualTimeEngine';
import type { Segment, Tag } from '../../../../types';

interface TimelineProps {
  engine: VirtualTimeEngine;
  segments: Segment[];
  tags: Tag[];
  virtualProgress: number;
  onSeek: (virtualPercentage: number) => void;
}

export const Timeline: React.FC<TimelineProps> = ({ 
  engine, segments, tags, virtualProgress, onSeek 
}) => {
  const virtualDuration = engine.getVirtualDuration();
  const realDuration = engine['realDuration'] || 0; // Usando fallback seguro

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

  const TRACK_HEIGHT = 65; 

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')} min`;
  };

  return (
    <Box sx={{ position: 'relative', mt: 4 }}>
      {/* Indicador de Tiempo Real */}
      <Typography 
        variant="caption" 
        sx={{ position: 'absolute', top: -25, right: 0, color: 'text.secondary', fontWeight: 'bold' }}
      >
        {formatTime(realDuration)} ➔
      </Typography>

      <Box 
        onClick={handleTimelineClick}
        sx={{ 
          position: 'relative', 
          width: '100%', 
          height: totalTracks * TRACK_HEIGHT, 
          backgroundColor: '#80d8e5', // Celeste Adobe Premiere
          cursor: 'pointer',
          overflow: 'hidden',
          borderRadius: 1,
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.1)'
        }}
      >
        {/* Etiquetas Visibles */}
        {visibleTracks.map((seg, i) => (
          <Tooltip key={`vis-${i}`} title={`${seg.tag.name} (${Math.round(seg.endV - seg.startV)}s)`} arrow>
            <Box sx={{
              position: 'absolute',
              left: `${seg.leftPct}%`,
              width: `${seg.widthPct}%`,
              top: seg.trackIndex * TRACK_HEIGHT + 15,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              zIndex: 6,
              transition: 'filter 0.2s',
              '&:hover': { filter: 'brightness(0.9)' }
            }}>
              <Box sx={{
                width: '85%',
                height: 6,
                backgroundColor: seg.tag.color,
                mx: 'auto',
                borderRadius: 4
              }} />
              <Typography sx={{ 
                color: '#fff', 
                fontSize: '0.8rem',
                mt: 0.5,
                ml: '7.5%',
                whiteSpace: 'nowrap',
                fontWeight: 500,
                textShadow: '0px 1px 2px rgba(0,0,0,0.5)'
              }}>
                {seg.tag.name}
              </Typography>
            </Box>
          </Tooltip>
        ))}

        {/* Zonas Descartables */}
        {hiddenMarkers.map((marker, i) => (
          <Tooltip key={`hidden-${i}`} title={`Salto descartable de ${marker.durationReal}s`} arrow>
            <Box sx={{
              position: 'absolute',
              left: `${marker.leftPct}%`,
              top: 15,
              width: '15%', 
              zIndex: 5,
              display: 'flex',
              flexDirection: 'column',
            }}>
              <Typography sx={{ color: '#fff', fontSize: '0.7rem', mb: 0.2, ml: 0.5, textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
                {marker.durationReal} sec
              </Typography>
              <Box sx={{
                width: '100%',
                height: 6,
                backgroundColor: '#424242',
                borderRadius: 4
              }} />
              <Typography sx={{ color: '#fff', fontSize: '0.8rem', mt: 0.5, ml: 0.5, textShadow: '0px 1px 2px rgba(0,0,0,0.5)' }}>
                Descartable
              </Typography>
            </Box>
          </Tooltip>
        ))}

        {/* Cursor / Playhead */}
        <Box 
          sx={{
            position: 'absolute',
            left: `${virtualProgress}%`,
            top: 0,
            bottom: 0,
            width: 2,
            backgroundColor: '#1976d2', // Azul MUI
            zIndex: 10,
            pointerEvents: 'none',
            boxShadow: '0 0 4px rgba(25, 118, 210, 0.8)'
          }}
        />
      </Box>
    </Box>
  );
};