"use client";

import { Children, isValidElement, useCallback, useEffect, useRef, useState, type ReactNode } from "react";

export interface HorizontalCarouselProps {
  /** Bumps internal measurements when the slide set changes. */
  depKey: string;
  prevLabel: string;
  nextLabel: string;
  regionLabel: string;
  labelledBy?: string;
  children: ReactNode;
}

export function HorizontalCarousel({
  depKey,
  prevLabel,
  nextLabel,
  regionLabel,
  labelledBy,
  children,
}: HorizontalCarouselProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [needsNav, setNeedsNav] = useState(false);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(false);

  const syncScrollState = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    const overflow = scrollWidth > clientWidth + 2;
    setNeedsNav(overflow);
    if (!overflow) {
      setCanPrev(false);
      setCanNext(false);
      return;
    }
    const maxScroll = scrollWidth - clientWidth;
    setCanPrev(scrollLeft > 2);
    setCanNext(scrollLeft < maxScroll - 2);
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    syncScrollState();
    const onScroll = () => syncScrollState();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(() => syncScrollState());
    ro.observe(el);
    const t = window.requestAnimationFrame(() => syncScrollState());
    return () => {
      window.cancelAnimationFrame(t);
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
    };
  }, [depKey, syncScrollState]);

  const scrollByDir = (dir: -1 | 1) => {
    const el = trackRef.current;
    if (!el) return;
    const delta = Math.max(Math.floor(el.clientWidth * 0.88), 280) * dir;
    el.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="horizontal-carousel">
      {needsNav ? (
        <>
          <button
            type="button"
            className="horizontal-carousel__btn horizontal-carousel__btn--prev"
            aria-label={prevLabel}
            disabled={!canPrev}
            onClick={() => scrollByDir(-1)}
          >
            <CarouselChevronLeft />
          </button>
          <button
            type="button"
            className="horizontal-carousel__btn horizontal-carousel__btn--next"
            aria-label={nextLabel}
            disabled={!canNext}
            onClick={() => scrollByDir(1)}
          >
            <CarouselChevronRight />
          </button>
        </>
      ) : null}
      <div
        ref={trackRef}
        className="horizontal-carousel__track"
        tabIndex={0}
        role="region"
        aria-label={labelledBy ? undefined : regionLabel}
        aria-labelledby={labelledBy}
      >
        {Children.map(children, (child, index) => (
          <div
            key={isValidElement(child) && child.key != null ? String(child.key) : index}
            className="horizontal-carousel__slide"
          >
            {child}
          </div>
        ))}
      </div>
    </div>
  );
}

function CarouselChevronLeft() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 6L9 12L15 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CarouselChevronRight() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M9 6L15 12L9 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
