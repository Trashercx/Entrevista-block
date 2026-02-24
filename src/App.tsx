// src/App.tsx
import { videoPayload } from './mocks/videoData';
import { VideoPlayer } from './components/Player/VideoPlayer';
import './App.css';

function App() {
  return (
    <div className="App">
      <h1>Evaluación de Entrevistas</h1>
      <VideoPlayer data={videoPayload} />
    </div>
  );
}

export default App;