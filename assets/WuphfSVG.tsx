import React, { SVGProps } from 'react'

export interface WuphfSVGProps extends SVGProps<SVGSVGElement> {
  styleName?: string
}

export default function WuphfSVG({
  styleName = '',
  width,
  height,
  className = '',
  ...props
}: WuphfSVGProps) {
  return (
    <svg
      className={`w-full text-text [&_path]:stroke-current [&_path]:stroke-[20] [&_ellipse]:fill-current [&_.nose]:fill-current ${styleName} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      version="1.1"
      viewBox="0 0 491.083 336.123"
      width={width}
      height={height}
      {...props}
    >
      <g
        strokeDasharray="none"
        strokeMiterlimit="4"
        strokeWidth="15"
        transform="translate(-19.18 -17.027)"
      >
        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeOpacity="1"
          d="M26.68 263.593s46.916-86.464 71.685-125.69c28.976-48.362 59.382-77.59 108.009-98.364 35.508-15.05 83.448-16.674 152.048-13.823 27.148 5.603 44.616 14.956 61.029 31.329 7.55 7.531 19.916 23.573 23.28 35.978 5.489 20.242 5.055 46.167 5.055 46.167 17.44 5.786 35.642 11.572 49.826 17.358 13.224 35.848-3.638 82.688-9.322 95.794l-79.4 48.54"
        />

        <ellipse
          cx="310.695"
          cy="119.731"
          rx="24.846"
          ry="25.458"
          fill="currentColor"
        />

        <ellipse
          cx="400.439"
          cy="174.661"
          rx="14.119"
          ry="25.443"
          transform="matrix(.98842 -.15175 .1438 .9896 0 0)"
          fill="currentColor"
        />

        <path
          className="nose"
          fill="currentColor"
          stroke="currentColor"
          strokeLinecap="butt"
          strokeLinejoin="miter"
          strokeOpacity="1"
          d="M413.064 169.57c23.26-11.338 46.52-14.446 69.781-14.32l1.819 18.185-29.55 23.867c-18.262-11.055-35.9-7.385-42.05-27.731z"
          display="inline"
          paintOrder="normal"
        />

        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeOpacity="1"
          d="M362.337 212.904c9.8 11.201 51.218 21.012 92.74-11.365 9.148 23.175 34.777 21.139 34.777 21.139"
          display="inline"
        />

        <path
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="miter"
          strokeOpacity="1"
          d="M95.15 162.013c-11.679 42.968-37.694 112.1-35.038 128.903 3.845 14.586 17.695 15.63 31.824 28.931 21.306 15.126 40.703 28.345 68.148 25.395l32.467-3.214-5.464-198.338c1.226-15.442 8.357-25.395 8.357-25.395"
        />
      </g>
    </svg>
  )
}
