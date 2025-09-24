"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { useScrollIdle } from "@/hooks/useScrollIdle";

interface LazyImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  /** Ordered list of image sources to try; first successful one is used */
  srcList: string[];
  /** Start loading when within this margin of viewport */
  rootMargin?: string;
  /** Intersection threshold array or single value */
  threshold?: number | number[];
  /** When true, clears src when far offscreen to release memory */
  unloadOffscreen?: boolean;
  /** Delay before unloading after leaving viewport */
  offscreenDelayMs?: number;
  /** Optional className applied to the inner img element */
  imgClassName?: string;
  /** Optional style applied to the inner img element */
  imgStyle?: React.CSSProperties;
}

export default function LazyImage({
  srcList,
  alt,
  className,
  style,
  rootMargin = "50px",
  threshold = 0.1,
  unloadOffscreen = false,
  offscreenDelayMs = 6000,
  onLoad,
  onError,
  imgClassName,
  imgStyle,
  ...imgProps
}: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isInView, setIsInView] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [loadingAllowed, setLoadingAllowed] = useState(false);
  const offscreenTimerRef = useRef<number | null>(null);
  const isScrollIdle = useScrollIdle();

  // Start loading immediately when in view, don't wait for scroll idle
  const currentSrc = isInView ? srcList[currentIndex] : "";

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === "undefined" || !("IntersectionObserver" in window)) {
      // Fallback: if no IO, mark as in view to load normally
      setIsInView(true);
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (entry.isIntersecting) {
          setIsInView(true);
          if (offscreenTimerRef.current) {
            window.clearTimeout(offscreenTimerRef.current);
            offscreenTimerRef.current = null;
          }
        } else if (unloadOffscreen) {
          if (offscreenTimerRef.current) window.clearTimeout(offscreenTimerRef.current);
          offscreenTimerRef.current = window.setTimeout(() => {
            setIsInView(false);
            setLoaded(false);
            setLoadingAllowed(false);
          }, offscreenDelayMs);
        }
      },
      { root: null, rootMargin, threshold }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (offscreenTimerRef.current) window.clearTimeout(offscreenTimerRef.current);
    };
  }, [rootMargin, threshold, unloadOffscreen, offscreenDelayMs]);

  // Reset error state when srcList changes
  useEffect(() => {
    setCurrentIndex(0);
    setHadError(false);
    setLoaded(false);
    setLoadingAllowed(false);
  }, [srcList.join("|")]);

  // Only load when in view AND scroll is idle for better performance
  useEffect(() => {
    if (isInView && isScrollIdle) {
      setLoadingAllowed(true);
    } else if (unloadOffscreen) {
      setLoadingAllowed(false);
    }
  }, [isInView, isScrollIdle, unloadOffscreen]);

  const handleLoad = useCallback<NonNullable<LazyImageProps["onLoad"]>>(
    (e) => {
      setLoaded(true);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback<NonNullable<LazyImageProps["onError"]>>(
    (e) => {
      setHadError(true);
      if (currentIndex < srcList.length - 1) {
        setCurrentIndex((idx) => idx + 1);
        setLoaded(false);
      }
      onError?.(e);
    },
    [currentIndex, srcList.length, onError]
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {/* Render img only when in view (or keep without src to preserve layout) */}
      <img
        ref={imgRef}
        alt={alt}
        src={currentSrc || undefined}
        loading="lazy"
        onLoad={handleLoad}
        onError={handleError}
        className={imgClassName}
        style={imgStyle}
        {...imgProps}
      />
    </div>
  );
}

