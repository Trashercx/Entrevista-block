
export interface Tag {
  id: string; 
  name: string; 
  color: string; 
  isHidden: boolean; 
}

export interface Segment {
  id: string; 
  tagId: string; 
  startReal: number; 
  endReal: number; 
}


export interface VideoDataPayload {
  videoUrl: string;
  tags: Tag[];
  segments: Segment[];
}