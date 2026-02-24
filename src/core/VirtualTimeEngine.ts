import type { Segment, Tag } from '../types';

type Range = { start: number; end: number };

export class VirtualTimeEngine {
  private hiddenSegments: Range[] = [];
  private realDuration = 0;
  private virtualDuration = 0;

  constructor(segments: Segment[], tags: Tag[], realDuration: number) {
    this.realDuration = Math.max(0, realDuration);
    this.hiddenSegments = this.normalizeHiddenSegments(segments, tags);
    this.calculateVirtualDuration();
  }

  private normalizeHiddenSegments(segments: Segment[], tags: Tag[]): Range[] {
    const hiddenTagIds = new Set(tags.filter((t) => t.isHidden).map((t) => t.id));

    const rawHidden = segments
      .filter((s) => hiddenTagIds.has(s.tagId))
      .map((s) => ({ start: s.startReal, end: s.endReal }))
      .map(({ start, end }) => ({
        start: Math.max(0, Math.min(start, end)),
        end: Math.max(0, Math.max(start, end)),
      }))
      .filter(({ start, end }) => end > start)
      .sort((a, b) => a.start - b.start);

    const merged: Range[] = [];
    for (const current of rawHidden) {
      if (merged.length === 0) {
        merged.push({ ...current });
        continue;
      }

      const last = merged[merged.length - 1];
      if (current.start <= last.end) {
        last.end = Math.max(last.end, current.end);
      } else {
        merged.push({ ...current });
      }
    }

    return merged;
  }

  private calculateVirtualDuration() {
    const totalHiddenTime = this.hiddenSegments.reduce((acc, seg) => {
      const clampedStart = Math.min(seg.start, this.realDuration);
      const clampedEnd = Math.min(seg.end, this.realDuration);
      return acc + Math.max(0, clampedEnd - clampedStart);
    }, 0);

    this.virtualDuration = Math.max(0, this.realDuration - totalHiddenTime);
  }

  public getVirtualDuration(): number {
    return this.virtualDuration;
  }

  public getRealDuration(): number {
    return this.realDuration;
  }

  public setRealDuration(duration: number): void {
    this.realDuration = Math.max(0, duration);
    this.calculateVirtualDuration();
  }

  public realToVirtual(realTime: number): number {
    const clampedReal = Math.max(0, Math.min(realTime, this.realDuration));
    let virtualTime = clampedReal;

    for (const seg of this.hiddenSegments) {
      if (clampedReal >= seg.end) {
        virtualTime -= seg.end - seg.start;
      } else if (clampedReal > seg.start) {
        virtualTime -= clampedReal - seg.start;
        break;
      } else {
        break;
      }
    }

    return Math.max(0, Math.min(virtualTime, this.virtualDuration));
  }

  public virtualToReal(virtualTime: number): number {
    const clampedVirtual = Math.max(0, Math.min(virtualTime, this.virtualDuration));
    let cursorReal = 0;
    let cursorVirtual = 0;

    for (const hidden of this.hiddenSegments) {
      const visibleStart = cursorReal;
      const visibleEnd = Math.min(hidden.start, this.realDuration);
      const visibleLength = Math.max(0, visibleEnd - visibleStart);

      if (clampedVirtual <= cursorVirtual + visibleLength) {
        return visibleStart + (clampedVirtual - cursorVirtual);
      }

      cursorVirtual += visibleLength;
      cursorReal = Math.min(hidden.end, this.realDuration);
    }

    return Math.min(this.realDuration, cursorReal + (clampedVirtual - cursorVirtual));
  }

  public getValidRealTime(currentRealTime: number): number {
    const clampedReal = Math.max(0, Math.min(currentRealTime, this.realDuration));
    for (const seg of this.hiddenSegments) {
      if (clampedReal >= seg.start && clampedReal < seg.end) {
        return Math.min(seg.end, this.realDuration);
      }
    }
    return clampedReal;
  }

  public getHiddenSegments(): Range[] {
    return this.hiddenSegments.map((segment) => ({ ...segment }));
  }

  public getValidCutPoints(segments: Segment[], tags: Tag[]): number[] {
    const hiddenTagIds = new Set(tags.filter((t) => t.isHidden).map((t) => t.id));
    const points = new Set<number>([0, this.realDuration]);

    segments.forEach((segment) => {
      if (!hiddenTagIds.has(segment.tagId)) {
        points.add(this.getValidRealTime(segment.startReal));
        points.add(this.getValidRealTime(segment.endReal));
      }
    });

    return Array.from(points)
      .filter((point) => point >= 0 && point <= this.realDuration)
      .sort((a, b) => a - b);
  }

  public getActiveVisibleSegment(segments: Segment[], tags: Tag[], realTime: number): Segment | null {
    const hiddenTagIds = new Set(tags.filter((t) => t.isHidden).map((t) => t.id));
    const validReal = this.getValidRealTime(realTime);

    for (const segment of segments) {
      if (hiddenTagIds.has(segment.tagId)) continue;
      if (validReal >= segment.startReal && validReal <= segment.endReal) {
        return segment;
      }
    }

    return null;
  }
}
