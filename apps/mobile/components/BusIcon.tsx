import React from "react";
import Svg, { Rect, Path, Circle } from "react-native-svg";

interface BusIconProps {
  size?: number;
  color?: string;
}

export default function BusIcon({
  size = 48,
  color = "#059669",
}: BusIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Roof */}
      <Path
        d="M20,20 C20,15 80,15 80,20 L80,30 L20,30 Z"
        fill="#1E1E1E"
      />
      {/* Windshield */}
      <Path
        d="M22,30 L78,30 L76,55 L24,55 Z"
        fill="#E8F0FE"
        stroke="#1E1E1E"
        strokeWidth="3.5"
      />
      {/* Front Destination Board */}
      <Rect
        x="35"
        y="22"
        width="30"
        height="6"
        rx="1"
        fill="#FFFFFF"
        stroke="#1E1E1E"
        strokeWidth="1"
      />
      
      {/* Green body panel */}
      <Path
        d="M18,55 L82,55 L80,88 C80,91 77,93 74,93 L26,93 C23,93 20,91 20,88 Z"
        fill={color}
      />
      
      {/* Headlights */}
      <Circle
        cx="28"
        cy="74"
        r="8"
        fill="#FFFFFF"
        stroke="#191919"
        strokeWidth="2.5"
      />
      <Circle cx="28" cy="74" r="4.5" fill="#3B82F6" />

      <Circle
        cx="72"
        cy="74"
        r="8"
        fill="#FFFFFF"
        stroke="#191919"
        strokeWidth="2.5"
      />
      <Circle cx="72" cy="74" r="4.5" fill="#3B82F6" />

      {/* Grill */}
      <Rect
        x="38"
        y="68"
        width="24"
        height="12"
        rx="2"
        fill="#1E1E1E"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      
      {/* Wheels */}
      <Rect x="26" y="93" width="10" height="7" rx="1.5" fill="#1E1E1E" />
      <Rect x="64" y="93" width="10" height="7" rx="1.5" fill="#1E1E1E" />
    </Svg>
  );
}
