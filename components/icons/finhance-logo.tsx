import type { SVGProps } from "react";

export const FinhanceLogo = (props: SVGProps<SVGSVGElement>) => {
  return (
    <svg
      viewBox="0 0 160 160"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      {...props}
    >
      <defs>
        <linearGradient id="finhanceGlow" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#2563EB" />
          <stop offset="100%" stopColor="#22D3EE" />
        </linearGradient>

        <filter id="softGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="6" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <path
        d="
          M30 130
          L55 25
          H135
          L125 45
          H75
          L70 65
          H115
          L105 85
          H65
          L55 110
          Z
        "
        fill="url(#finhanceGlow)"
        filter="url(#softGlow)"
      />
    </svg>
  );
};
