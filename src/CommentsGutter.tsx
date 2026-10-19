import { useLayoutEffect, useState } from 'react';
import { findBlock } from './dom-positions';

interface Placed {
  elementId: string;
  count: number;
  top: number;
}

/**
 * Right-margin comment markers: one small badge per element that carries open comments, aligned to the
 * element's top and clamped to the editor's right edge. Clicking a marker asks the host app to open that
 * thread (the thread UI itself lives in the app's Comments panel, not here). Positioned the same way as
 * `RemoteCursors` — measured from the DOM relative to the scroll container, recomputed on `tick`.
 */
export function CommentsGutter(props: {
  container: HTMLElement | null;
  page: HTMLElement | null;
  /** elementId → number of open comments on it. */
  counts: ReadonlyMap<string, number>;
  onOpen?: (elementId: string) => void;
  /** Bumped on scroll/resize/render so positions recompute. */
  tick: number;
}) {
  const { container, page, counts, onOpen, tick } = props;
  const [placed, setPlaced] = useState<Placed[]>([]);

  useLayoutEffect(() => {
    if (!container || !page || counts.size === 0) return setPlaced([]);
    const cRect = container.getBoundingClientRect();
    const out: Placed[] = [];
    for (const [elementId, count] of counts) {
      const block = findBlock(page, elementId);
      if (!block) continue;
      const rect = block.getBoundingClientRect();
      out.push({ elementId, count, top: rect.top - cRect.top + container.scrollTop });
    }
    setPlaced((prev) => (JSON.stringify(prev) === JSON.stringify(out) ? prev : out));
  }, [container, page, counts, tick]);

  if (placed.length === 0) return null;
  return (
    <div className="wui-overlay" data-testid="comments-gutter">
      {placed.map((p) => (
        <button
          key={p.elementId}
          type="button"
          className="wui-comment-marker"
          data-el-id={p.elementId}
          title={`${p.count} comment${p.count === 1 ? '' : 's'}`}
          style={{ top: p.top }}
          onClick={() => onOpen?.(p.elementId)}
        >
          {p.count}
        </button>
      ))}
    </div>
  );
}
