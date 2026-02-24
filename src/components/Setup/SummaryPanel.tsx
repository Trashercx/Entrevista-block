// src/components/Setup/SummaryPanel.tsx
import React from 'react';
import { Box, Paper, Typography, Divider, Chip } from '@mui/material';
import type { Tag, Segment } from '../../types';

interface SummaryPanelProps {
  tags: Tag[];
  segments: Segment[];
}

export const SummaryPanel: React.FC<SummaryPanelProps> = ({ tags, segments }) => {
  // Agrupar segmentos por etiqueta
  const segmentsByTag = tags
    .map((tag) => ({
      tag,
      segments: segments
        .filter((s) => s.tagId === tag.id)
        .sort((a, b) => a.startReal - b.startReal),
    }))
    .filter((group) => group.segments.length > 0); // Solo mostrar etiquetas que tengan segmentos

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" mb={2} fontWeight="bold">
        Resumen Automático
      </Typography>

      {segmentsByTag.length === 0 ? (
        <Typography variant="body2" color="text.secondary">
          No hay segmentos registrados aún.
        </Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {segmentsByTag.map((group, index) => (
            <Box key={group.tag.id}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Box
                  sx={{
                    width: 12,
                    height: 12,
                    borderRadius: '50%',
                    backgroundColor: group.tag.color,
                  }}
                />
                <Typography variant="subtitle1" fontWeight="bold">
                  {group.tag.name} {group.tag.isHidden && '(Descartable)'}
                </Typography>
                <Chip size="small" label={`${group.segments.length} hallazgos`} />
              </Box>

              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, pl: 2 }}>
                {group.segments.map((seg) => (
                  <Chip
                    key={seg.id}
                    label={`${formatTime(seg.startReal)} - ${formatTime(
                      seg.endReal,
                    )}`}
                    variant="outlined"
                    size="small"
                  />
                ))}
              </Box>
              {index < segmentsByTag.length - 1 && <Divider sx={{ mt: 2 }} />}
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};
