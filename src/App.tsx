// src/App.tsx
import { useState, useRef } from 'react';
import { VideoPlayer } from './components/Player/VideoPlayer';
import type { VideoPlayerRef } from './components/Player/VideoPlayer';
import { VideoUploader } from './components/Setup/VideoUploader';
import { TaggingPanel } from './components/Setup/TaggingPanel';
import { SummaryPanel } from './components/Setup/SummaryPanel';
import { videoPayload } from './mocks/videoData';
import type { Segment } from './types';
import { Box, Typography, Button, Container } from '@mui/material';
import { LogOut } from 'lucide-react';
import './App.css';

function App() {
  const playerRef = useRef<VideoPlayerRef>(null);
  
  // Estados Dinámicos de la Aplicación
  const [activeVideoUrl, setActiveVideoUrl] = useState<string | null>(null);
  const tags = videoPayload.tags;
  const [segments, setSegments] = useState<Segment[]>(videoPayload.segments);

  const handleVideoLoad = (url: string) => {
    setActiveVideoUrl(url);
    // Aquí a futuro podríamos limpiar los segmentos si es un video nuevo:
    // setSegments([]); 
  };

  const handleReset = () => {
    setActiveVideoUrl(null);
  };

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f7fa', pb: 8 }}>
      {/* Header Corporativo */}
      <Box sx={{ backgroundColor: '#fff', borderBottom: '1px solid #e0e0e0', py: 2, px: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6" fontWeight="bold" color="primary">
          EvalCore | Tiempo Virtual
        </Typography>
        {activeVideoUrl && (
          <Button 
            variant="text" 
            color="inherit" 
            startIcon={<LogOut size={18} />}
            onClick={handleReset}
          >
            Cambiar Video
          </Button>
        )}
      </Box>

      <Container maxWidth="lg" sx={{ mt: 4 }}>
        {/* Renderizado Condicional: Subida de Video vs Reproductor */}
        {!activeVideoUrl ? (
          <VideoUploader onVideoLoaded={handleVideoLoad} />
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            
            <VideoPlayer 
              ref={playerRef} 
              data={{ videoUrl: activeVideoUrl, tags, segments }} 
            />

            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 4 }}>
              {/* Panel de Etiquetado Dinámico */}
              <TaggingPanel 
                tags={tags}
                getCurrentTime={() => playerRef.current?.getCurrentTime() || 0}
                onAddSegment={(newSegment) => {
                  setSegments(prev => [...prev, newSegment]);
                }}
              />

              {/* Resumen Automático exigido por el PO */}
              <SummaryPanel 
                tags={tags}
                segments={segments}
              />
            </Box>

          </Box>
        )}
      </Container>
    </Box>
  );
}

export default App;