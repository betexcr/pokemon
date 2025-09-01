"use client";

import { cva, type VariantProps } from "class-variance-authority";
import clsx from "clsx";
import * as React from "react";

const button = cva(
  "inline-flex items-center justify-center rounded-xl font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-bg mx-1",
  {
    variants: {
      variant: {
        primary:  "bg-poke-red text-white hover:bg-poke-red/90",
        cta:      "bg-poke-yellow text-black hover:bg-poke-yellow/90",
        secondary:"bg-surface text-text border border-border hover:bg-white/60 dark:hover:bg-white/10 dark:text-white font-medium",
        outline:  "bg-transparent text-text border border-border hover:bg-white/50 dark:hover:bg-white/10 font-medium",
        ghost:    "bg-transparent text-text hover:bg-white/50 dark:hover:bg-white/10 font-medium",
        link:     "bg-transparent text-poke-blue underline-offset-4 hover:underline",
      },
      size: {
        sm: "h-9 px-4 text-sm",
        md: "h-11 px-5 text-sm",
        lg: "h-12 px-6 text-base",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  }
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof button>;

export default function Button({ className, variant, size, ...props }: ButtonProps) {
  return <button className={clsx(button({ variant, size }), className)} {...props} />;
}



