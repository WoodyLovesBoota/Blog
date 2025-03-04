// Auto-generated file created by svgr-cli source svg-template.js
// Run yarn icons:create to update
// Do not edit
import * as React from "react";
import type { SVGProps } from "react";
const SvgArrowShadowRight = (props: SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 60 60"
    fill="none"
    width={props.width || 24}
    height={props.height || 24}
    style={props.style || {}}
    onClick={props.onClick}
    {...props}
  >
    <g clipPath="url(#clip0_452_3599)">
      <g filter="url(#filter0_dd_452_3599)">
        <path
          d="M20 10L40 30L20 50"
          stroke="white"
          strokeWidth={4.5}
          strokeLinecap="round"
        />
      </g>
    </g>
    <defs>
      <filter
        id="filter0_dd_452_3599"
        x={11.75}
        y={3.75}
        width={37.432}
        height={56.5}
        filterUnits="userSpaceOnUse"
        colorInterpolationFilters="sRGB"
      >
        <feFlood floodOpacity={0} result="BackgroundImageFix" />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset dy={2} />
        <feGaussianBlur stdDeviation={3} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.16 0"
        />
        <feBlend
          mode="normal"
          in2="BackgroundImageFix"
          result="effect1_dropShadow_452_3599"
        />
        <feColorMatrix
          in="SourceAlpha"
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0"
          result="hardAlpha"
        />
        <feOffset />
        <feGaussianBlur stdDeviation={0.5} />
        <feComposite in2="hardAlpha" operator="out" />
        <feColorMatrix
          type="matrix"
          values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.1 0"
        />
        <feBlend
          mode="normal"
          in2="effect1_dropShadow_452_3599"
          result="effect2_dropShadow_452_3599"
        />
        <feBlend
          mode="normal"
          in="SourceGraphic"
          in2="effect2_dropShadow_452_3599"
          result="shape"
        />
      </filter>
      <clipPath id="clip0_452_3599">
        <rect
          width={60}
          height={60}
          fill="white"
          transform="matrix(-1 0 0 1 60 0)"
        />
      </clipPath>
    </defs>
  </svg>
);
export default SvgArrowShadowRight;
