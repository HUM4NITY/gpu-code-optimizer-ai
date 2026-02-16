import React from "react";

export const Logo = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 200 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* NVIDIA-inspired geometric shape */}
      <path
        d="M8 8L24 8L32 20L24 32L8 32L16 20L8 8Z"
        fill="oklch(0.70 0.18 130)"
        fillOpacity="0.9"
      />
      <path
        d="M24 8L32 20L24 32"
        stroke="oklch(0.70 0.18 130)"
        strokeWidth="2"
        strokeLinecap="round"
      />
      
      {/* GPU text */}
      <text
        x="44"
        y="27"
        fill="currentColor"
        fontSize="20"
        fontWeight="700"
        fontFamily="system-ui, -apple-system, sans-serif"
      >
        GPU Optimizer
      </text>
    </svg>
  );
};

export const LogoIcon = ({ className = "" }: { className?: string }) => {
  return (
    <svg
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <path
        d="M8 8L24 8L32 20L24 32L8 32L16 20L8 8Z"
        fill="oklch(0.70 0.18 130)"
        fillOpacity="0.9"
      />
      <path
        d="M24 8L32 20L24 32"
        stroke="oklch(0.70 0.18 130)"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
};
