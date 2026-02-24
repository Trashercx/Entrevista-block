import type { Segment, Tag } from '../types';

export class VirtualTimeEngine {
  private hiddenSegments: { start: number; end: number }[] = [];
  private realDuration: number = 0;
  private virtualDuration: number = 0;

  constructor(segments: Segment[], tags: Tag[], realDuration: number) {
    this.realDuration = realDuration;
    this.normalizeHiddenSegments(segments, tags);
    this.calculateVirtualDuration();
  }

  // 1. Normalización de Solapamientos
  private normalizeHiddenSegments(segments: Segment[], tags: Tag[]) {
    const hiddenTagIds = new Set(tags.filter(t => t.isHidden).map(t => t.id));
    
    // Extraer y ordenar los segmentos ocultos
    const rawHidden = segments
      .filter(s => hiddenTagIds.has(s.tagId))
      .map(s => ({ start: s.startReal, end: s.endReal }))
      .sort((a, b) => a.start - b.start);

    // Fusionar segmentos que se cruzan
    const merged: { start: number; end: number }[] = [];
    for (const current of rawHidden) {
      if (merged.length === 0) {
        merged.push({ ...current });
        continue;
      }
      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end); // Se fusionan
      } else {
        merged.push({ ...current });
      }
    }
    this.hiddenSegments = merged;
  }

  // 2. Cálculo de Duración Virtual
  private calculateVirtualDuration() {
    const totalHiddenTime = this.hiddenSegments.reduce(
      (acc, seg) => acc + (seg.end - seg.start),
      0
    );
    this.virtualDuration = this.realDuration - totalHiddenTime;
  }

  public getVirtualDuration(): number {
    return this.virtualDuration;
  }

  public setRealDuration(duration: number): void {
    this.realDuration = duration;
    this.calculateVirtualDuration();
  }

  // 3. Traductores Bidireccionales
  public realToVirtual(realTime: number): number {
    let virtualTime = realTime;
    for (const seg of this.hiddenSegments) {
      if (realTime > seg.end) {
        virtualTime -= (seg.end - seg.start);
      } else if (realTime >= seg.start && realTime <= seg.end) {
        virtualTime -= (realTime - seg.start);
        break;
      } else {
        break;
      }
    }
    return Math.max(0, virtualTime);
  }

  public virtualToReal(virtualTime: number): number {
    let realTime = virtualTime;
    for (const seg of this.hiddenSegments) {
      if (realTime >= seg.start) {
        realTime += (seg.end - seg.start);
      } else {
        break;
      }
    }
    return Math.min(this.realDuration, realTime);
  }

  // 4. Validador de Saltos
  public getValidRealTime(currentRealTime: number): number {
    for (const seg of this.hiddenSegments) {
      if (currentRealTime >= seg.start && currentRealTime < seg.end) {
        return seg.end; // Devuelve el tiempo de salida inmediato
      }
    }
    return currentRealTime;
  }
}