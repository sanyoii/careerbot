"use client";

import * as React from "react";

interface IndicatorPos {
  left: number;
  width: number;
}

/**
 * Tracks the active tab trigger's layout position so an absolutely-positioned
 * sliding indicator inside the TabsList can animate to it.
 *
 * Position is read with `offsetLeft` / `offsetWidth`. Both are layout-derived
 * integers measured from the trigger's `offsetParent` (the TabsList, which
 * must be `position: relative`). Using `offsetLeft` instead of paired
 * `getBoundingClientRect()` calls avoids subpixel drift and sidesteps
 * scroll/padding/border bookkeeping entirely.
 *
 * The indicator element MUST be anchored at `left: 0` so its static position
 * is the list's padding-box origin — the same origin `offsetLeft` is measured
 * from. Without an explicit `left`, the browser computes the static position
 * using the parent's `justify-content`, which silently shifts the indicator
 * by up to (listWidth - indicatorWidth) / 2.
 */
export function useTabIndicator(activeValue: string) {
  const listRef = React.useRef<HTMLDivElement | null>(null);
  const triggerRefs = React.useRef<Map<string, HTMLElement>>(new Map());
  const [indicator, setIndicator] = React.useState<IndicatorPos | null>(null);
  const [firstPaint, setFirstPaint] = React.useState(true);

  const measure = React.useCallback(() => {
    const el = triggerRefs.current.get(activeValue);
    if (!el) return;
    setIndicator({ left: el.offsetLeft, width: el.offsetWidth });
  }, [activeValue]);

  React.useLayoutEffect(() => {
    measure();
    const id = requestAnimationFrame(() => setFirstPaint(false));
    return () => cancelAnimationFrame(id);
  }, [measure]);

  // Re-measure whenever the list or any trigger changes size. A window-resize
  // listener would miss a sibling-panel toggle, a font swap, or any other
  // reflow that doesn't change the viewport.
  React.useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const list = listRef.current;
    if (!list) return;
    const ro = new ResizeObserver(() => measure());
    ro.observe(list);
    for (const trigger of triggerRefs.current.values()) ro.observe(trigger);
    return () => ro.disconnect();
  }, [measure]);

  // Webfonts can swap in after the initial measurement, changing trigger
  // widths by a few subpixels. Remeasure once they settle.
  React.useEffect(() => {
    if (typeof document === "undefined" || !document.fonts?.ready) return;
    let cancelled = false;
    document.fonts.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
    };
  }, [measure]);

  const setTriggerRef = React.useCallback(
    (value: string) => (el: HTMLElement | null) => {
      if (el) triggerRefs.current.set(value, el);
      else triggerRefs.current.delete(value);
    },
    [],
  );

  return { listRef, setTriggerRef, indicator, firstPaint };
}
