// src/components/Setup/VideoUploader.tsx
import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, Button, Divider } from '@mui/material';
import { Upload, Link as LinkIcon, Video } from 'lucide-react';

interface VideoUploaderProps {
  onVideoLoaded: (url: string) => void;
}

export const VideoUploader: React.FC<VideoUploaderProps> = ({ onVideoLoaded }) => {
  const [urlInput, setUrlInput] = useState('');

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (urlInput.trim()) {
      onVideoLoaded(urlInput.trim());
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Creamos una URL local temporal para el archivo subido
      const localUrl = URL.createObjectURL(file);
      onVideoLoaded(localUrl);
    }
  };

  return (
    <Paper elevation={3} sx={{ p: 4, maxWidth: 600, mx: 'auto', mt: 8, borderRadius: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3, gap: 2 }}>
        <Video size={32} color="#1976d2" />
        <Typography variant="h5" fontWeight="bold" color="text.primary">
          Configuración de la Entrevista
        </Typography>
      </Box>
      
      <Typography variant="body1" color="text.secondary" mb={4}>
        Para comenzar la evaluación estructurada, selecciona un archivo de video local o ingresa una URL externa (MP4, S3, etc.).
      </Typography>

      {/* Opción 1: Archivo Local */}
      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <input
          accept="video/mp4,video/webm,video/ogg"
          style={{ display: 'none' }}
          id="raised-button-file"
          type="file"
          onChange={handleFileUpload}
        />
        <label htmlFor="raised-button-file">
          <Button 
            variant="contained" 
            component="span" 
            size="large"
            startIcon={<Upload size={20} />}
            sx={{ px: 4, py: 1.5, borderRadius: 2 }}
          >
            Subir Video Local
          </Button>
        </label>
      </Box>

      <Divider sx={{ my: 3 }}>
        <Typography variant="body2" color="text.secondary">O INGRESAR ENLACE</Typography>
      </Divider>

      {/* Opción 2: URL Externa */}
      <Box component="form" onSubmit={handleUrlSubmit} sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="https://ejemplo.com/entrevista.mp4"
          value={urlInput}
          onChange={(e) => setUrlInput(e.target.value)}
          InputProps={{
            startAdornment: <LinkIcon size={20} color="#757575" style={{ marginRight: 8 }} />
          }}
        />
        <Button 
          type="submit" 
          variant="outlined" 
          disabled={!urlInput.trim()}
          sx={{ px: 3, borderRadius: 2 }}
        >
          Cargar
        </Button>
      </Box>
    </Paper>
  );
};