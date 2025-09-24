"use client";
import { useRouter } from "next/navigation";
import React from "react";

type TransitionType = 'shared-element' | 'battle-flash' | 'lobby-wipe' | 'compare-morph' | 'default';

type Props = React.PropsWithChildren<{ 
  href: string; 
  onBeforeNavigate?: () => void;
  transitionType?: TransitionType;
}>;

export default function LinkWithTransition({ 
  href, 
  children, 
  onBeforeNavigate, 
  transitionType = 'default' 
}: Props) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    onBeforeNavigate?.();
    
    // Handle different transition types
    switch (transitionType) {
      case 'battle-flash':
        // For battle routes, we'll handle the flash in the destination page
        router.push(href);
        break;
      case 'lobby-wipe':
        // For lobby transitions, we'll handle the wipe in the destination page
        router.push(href);
        break;
      case 'compare-morph':
        // For compare transitions, we'll handle the morph in the destination page
        router.push(href);
        break;
      case 'shared-element':
      case 'default':
      default:
        // Use native view transition for shared elements and default
        const nav = () => router.push(href);
        if (document.startViewTransition) {
          document.startViewTransition(nav);
        } else {
          nav();
        }
        break;
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="contents" // keep semantics/layout; style via child
    >
      {children}
    </button>
  );
}
