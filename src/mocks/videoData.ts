import type { Tag, Segment, VideoDataPayload } from '../types';

const mockTags: Tag[] = [
  { id: 't1', name: 'Liderazgo', color: '#ff4444', isHidden: false }, 
  { id: 't2', name: 'Trabajo en equipo', color: '#cddc39', isHidden: false }, 
  { id: 't3', name: 'Buena comunicación', color: '#4caf50', isHidden: false }, 
  { id: 't4', name: 'Descartable', color: '#424242', isHidden: true }, 
];

const mockSegments: Segment[] = [
 
  { id: 's1', tagId: 't1', startReal: 10, endReal: 30 }, 
  { id: 's2', tagId: 't3', startReal: 50, endReal: 80 },
  

  { id: 's3', tagId: 't2', startReal: 20, endReal: 60 }, 
  
  { id: 's4', tagId: 't4', startReal: 35, endReal: 45 }, 
  { id: 's5', tagId: 't4', startReal: 90, endReal: 105 }, 
];

export const videoPayload: VideoDataPayload = {
  videoUrl: 'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4', 
  tags: mockTags,
  segments: mockSegments,
};