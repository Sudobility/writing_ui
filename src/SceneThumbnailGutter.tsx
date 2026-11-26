import { useLayoutEffect, useState } from 'react';
import { findBlock } from './dom-positions';

interface Placed {
  elementId: string;
  src: string;
  alt: string;
  top: number;
}

/**
 * Right-margin thumbnail markers: one small image per element the host app wants to flag (e.g. a scene that has a
 * storyboard), aligned to the element's top and pinned to the editor's right edge, outside the editable page.
 * Clicking a thumbnail asks the host app to open whatever it represents. Positioned the same way as
 * `CommentsGutter`/`RemoteCursors` — measured from the DOM relative to the scroll container, recomputed on `tick`.
 * The gutter itself knows nothing about storyboards; the app supplies the image source and the click handler.
 */
export function SceneThumbnailGutter(props: {
  container: HTMLElement | null;
  page: HTMLElement | null;
  /** elementId → the thumbnail to show for it. */
  thumbnails: ReadonlyMap<string, { src: string; alt?: string }>;
  onOpen?: (elementId: string) => void;
  /** Bumped on scroll/resize/render so positions recompute. */
  tick: number;
}) {
  const { container, page, thumbnails, onOpen, tick } = props;
  const [placed, setPlaced] = useState<Placed[]>([]);

  useLayoutEffect(() => {
    if (!container || !page || thumbnails.size === 0) return setPlaced([]);
    const cRect = container.getBoundingClientRect();
    const out: Placed[] = [];
    for (const [elementId, thumb] of thumbnails) {
      const block = findBlock(page, elementId);
      if (!block) continue;
      const rect = block.getBoundingClientRect();
      out.push({ elementId, src: thumb.src, alt: thumb.alt ?? '', top: rect.top - cRect.top + container.scrollTop });
    }
    setPlaced((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out));
  }, [container, page, thumbnails, tick]);

  if (placed.length === 0) return null;
  return (
    <div className="wui-overlay" data-testid="scene-thumbnail-gutter">
      {placed.map((p) => (
        <button
          key={p.elementId}
          type="button"
          className="wui-storyboard-marker"
          data-el-id={p.elementId}
          title="View storyboard"
          aria-label="View storyboard"
          style={{ top: p.top }}
          onClick={() => onOpen?.(p.elementId)}
        >
          <img src={p.src} alt={p.alt} />
        </button>
      ))}
    </div>
  );
}
