"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { getCachedImageUrl } from "@/lib/imageCache";

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
  /** Priority loading for above-the-fold images (adds fetchpriority="high") */
  priority?: boolean;
  /** Image dimensions for CLS prevention */
  width?: number;
  height?: number;
}

/** 
 * Check if user is on a slow connection using Network Information API
 * Returns true if connection is slow or unknown
 */
function isSlowConnection(): boolean {
  if (typeof navigator === 'undefined' || !('connection' in navigator)) {
    return false; // Assume fast if API unavailable
  }
  
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  // Consider 2g, slow-2g as slow, or if saveData is enabled
  const slowTypes = ['slow-2g', '2g'];
  return slowTypes.includes(connection.effectiveType) || connection.saveData === true;
}

export default function LazyImage({
  srcList,
  alt,
  className,
  style,
  rootMargin = "100px", // Increased from 50px for better anticipatory loading
  threshold = 0.01, // Lower threshold for earlier loading
  unloadOffscreen = false,
  offscreenDelayMs = 8000, // Increased from 6000ms
  onLoad,
  onError,
  imgClassName,
  imgStyle,
  priority = false,
  width,
  height,
  ...imgProps
}: LazyImageProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);

  const [isInView, setIsInView] = useState(priority); // Priority images start visible
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [hadError, setHadError] = useState(false);
  const [cachedSrc, setCachedSrc] = useState<string>("");
  const offscreenTimerRef = useRef<number | null>(null);
  const retryTimeoutRef = useRef<number | null>(null);
  const isSlowNet = useRef(isSlowConnection());

  // Load immediately when in view - NO scroll idle wait for better performance
  const currentSrc = isInView ? srcList[currentIndex] : "";

  useEffect(() => {
    const el = containerRef.current;
    if (!el || typeof window === "undefined") {
      // Fallback: mark as in view to load normally
      setIsInView(true);
      return;
    }

    // Skip IntersectionObserver for priority images - load immediately
    if (priority) {
      setIsInView(true);
      return;
    }

    if (!("IntersectionObserver" in window)) {
      // Fallback for old browsers
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
          // Only unload if far from viewport
          if (offscreenTimerRef.current) window.clearTimeout(offscreenTimerRef.current);
          offscreenTimerRef.current = window.setTimeout(() => {
            setIsInView(false);
            setLoaded(false);
          }, offscreenDelayMs);
        }
      },
      { root: null, rootMargin, threshold }
    );

    io.observe(el);
    return () => {
      io.disconnect();
      if (offscreenTimerRef.current) window.clearTimeout(offscreenTimerRef.current);
      if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
    };
  }, [rootMargin, threshold, unloadOffscreen, offscreenDelayMs, priority]);

  // Reset error state when srcList changes
  useEffect(() => {
    setCurrentIndex(0);
    setHadError(false);
    setLoaded(false);
  }, [srcList.join("|")]);

  // Load cached image when in view - IMMEDIATE loading for better perceived performance
  useEffect(() => {
    if (currentSrc && isInView) {
      // For priority images or fast connections, skip caching overhead
      if (priority || !isSlowNet.current) {
        setCachedSrc(currentSrc);
      } else {
        // Use cache for slow connections
        getCachedImageUrl(currentSrc)
          .then(cachedUrl => {
            setCachedSrc(cachedUrl);
          })
          .catch(error => {
            console.warn('Failed to get cached image URL:', error);
            setCachedSrc(currentSrc); // Fallback to original URL
          });
      }
    }
  }, [currentSrc, isInView, priority]);

  const handleLoad = useCallback<NonNullable<LazyImageProps["onLoad"]>>(
    (e) => {
      setLoaded(true);
      setHadError(false);
      onLoad?.(e);
    },
    [onLoad]
  );

  const handleError = useCallback<NonNullable<LazyImageProps["onError"]>>(
    (e) => {
      setHadError(true);
      
      // Try next source if available
      if (currentIndex < srcList.length - 1) {
        setCurrentIndex((idx) => idx + 1);
        setLoaded(false);
      } else {
        // All sources failed, retry after delay
        if (retryTimeoutRef.current) window.clearTimeout(retryTimeoutRef.current);
        retryTimeoutRef.current = window.setTimeout(() => {
          setCurrentIndex(0);
          setHadError(false);
        }, 3000); // Retry after 3 seconds
      }
      
      onError?.(e);
    },
    [currentIndex, srcList.length, onError]
  );

  return (
    <div ref={containerRef} className={className} style={style}>
      {/* Always render img element to prevent layout shift */}
      <img
        ref={imgRef}
        alt={alt}
        src={cachedSrc || undefined}
        width={width}
        height={height}
        loading={priority ? "eager" : "lazy"}
        decoding="async" // 2026 best practice: non-blocking image decode
        fetchPriority={priority ? "high" : undefined} // Prioritize above-the-fold images
        onLoad={handleLoad}
        onError={handleError}
        className={imgClassName}
        style={imgStyle}
        {...imgProps}
      />
    </div>
  );
}

