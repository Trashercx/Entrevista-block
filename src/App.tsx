// src/App.tsx
import { useRef } from 'react';
import { videoPayload } from './mocks/videoData';
import { VideoPlayer } from './components/Player/VideoPlayer';
import type { VideoPlayerRef } from './components/Player/VideoPlayer';
import './App.css';

function App() {
  // Capturamos la referencia del reproductor para usar su API pública
  const playerRef = useRef<VideoPlayerRef>(null);

  return (
    <div className="App" style={{ padding: '40px 20px', fontFamily: 'sans-serif', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      <h1 style={{ textAlign: 'center', color: '#333', marginBottom: '30px' }}>
        Evaluación Estructurada de Entrevistas
      </h1>
      
      {/* Nuestro componente encapsulado e inteligente */}
      <VideoPlayer ref={playerRef} data={videoPayload} />

      {/* Controles externos demostrando el uso de useImperativeHandle */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        gap: '15px', 
        marginTop: '30px',
        padding: '20px',
        backgroundColor: '#fff',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        maxWidth: '800px',
        margin: '30px auto 0 auto'
      }}>
        <button 
          style={btnStyle} 
          onClick={() => playerRef.current?.prev()}
        >
          ⏮ Anterior
        </button>
        <button 
          style={{...btnStyle, backgroundColor: '#2196F3', color: 'white'}} 
          onClick={() => playerRef.current?.play()}
        >
          ▶️ Play
        </button>
        <button 
          style={{...btnStyle, backgroundColor: '#f44336', color: 'white'}} 
          onClick={() => playerRef.current?.pause()}
        >
          ⏸ Pause
        </button>
        <button 
          style={btnStyle} 
          onClick={() => playerRef.current?.next()}
        >
          Siguiente ⏭
        </button>
      </div>
    </div>
  );
}

// Estilos rápidos para los botones
const btnStyle = {
  padding: '10px 20px',
  border: 'none',
  borderRadius: '5px',
  backgroundColor: '#e0e0e0',
  color: '#333',
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'background-color 0.2s'
};

export default App;