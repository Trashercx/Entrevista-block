// src/components/Setup/TaggingPanel.tsx
import React, { useState } from 'react';
import { Box, Paper, Button, Typography } from '@mui/material';
import { Square, SquareCheck } from 'lucide-react';
import type { Tag, Segment } from '../../types';

interface TaggingPanelProps {
  tags: Tag[];
  getCurrentTime: () => number;
  onAddSegment: (segment: Segment) => void;
}

export const TaggingPanel: React.FC<TaggingPanelProps> = ({ tags, getCurrentTime, onAddSegment }) => {
  const [activeTagId, setActiveTagId] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  const handleTagClick = (tagId: string) => {
    const currentTime = getCurrentTime();

    if (activeTagId === tagId) {
      // Terminar grabación
      if (startTime !== null && startTime < currentTime) {
        const newSegment: Segment = {
          id: `seg-${Date.now()}`,
          tagId,
          startReal: startTime,
          endReal: currentTime,
        };
        onAddSegment(newSegment);
        setActiveTagId(null);
        setStartTime(null);
      }
    } else {
      // Iniciar grabación
      setActiveTagId(tagId);
      setStartTime(currentTime);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
      <Typography variant="h6" mb={2} fontWeight="bold">
        Panel de Etiquetado
      </Typography>
      <Typography variant="body2" color="text.secondary" mb={3}>
        Haz clic en una competencia para iniciar/finalizar el registro.
      </Typography>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
        {tags.map((tag) => (
            <Button
              fullWidth
              variant={activeTagId === tag.id ? 'contained' : 'outlined'}
              onClick={() => handleTagClick(tag.id)}
              sx={{
                p: 2,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                justifyContent: 'flex-start',
                borderColor: tag.color,
                color: activeTagId === tag.id ? '#fff' : tag.color,
                backgroundColor: activeTagId === tag.id ? tag.color : 'transparent',
                '&:hover': {
                  backgroundColor: activeTagId === tag.id ? tag.color : `${tag.color}20`,
                },
              }}
            >
              {activeTagId === tag.id ? (
                <SquareCheck size={20} />
              ) : (
                <Square size={20} />
              )}
              <Box sx={{ textAlign: 'left', flex: 1 }}>
                <Typography variant="subtitle2" fontWeight="bold">
                  {tag.name}
                </Typography>
                {activeTagId === tag.id && startTime !== null && (
                  <Typography variant="caption">
                    Desde: {formatTime(startTime)}
                  </Typography>
                )}
              </Box>
            </Button>
        ))}
      </Box>

      {activeTagId && startTime !== null && (
        <Box sx={{ mt: 3, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary">
            <strong>Grabando desde:</strong> {formatTime(startTime)}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            <strong>Duración:</strong> {formatTime(getCurrentTime() - startTime)}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};
