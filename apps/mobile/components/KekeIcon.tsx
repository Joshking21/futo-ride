import React from "react";
import Svg, { Rect, Path, Circle } from "react-native-svg";

interface KekeIconProps {
  size?: number;
  color?: string;
  secondaryColor?: string;
}

export default function KekeIcon({
  size = 48,
  color = "#001caa",
  secondaryColor = "#1d35d1",
}: KekeIconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" fill="none">
      {/* Roof */}
      <Path
        d="M22,25 C22,16 78,16 78,25 L78,42 L22,42 Z"
        fill="#1E1E1E"
      />
      {/* Windshield */}
      <Path
        d="M24,42 L76,42 L72,66 L28,66 Z"
        fill="#E8F0FE"
        stroke="#1E1E1E"
        strokeWidth="3.5"
      />
      {/* Driver Silhouette */}
      <Circle cx="60" cy="56" r="6" fill="#1E1E1E" />
      <Path d="M52,66 C52,60 68,60 68,66 Z" fill="#1E1E1E" />
      
      {/* Small badge center (GO or similar) */}
      <Circle cx="50" cy="56" r="5" fill="#1E1E1E" />
      <Path d="M49,54 L52,56 L49,58 Z" fill="#FFFFFF" />

      {/* Blue body panel */}
      <Path
        d="M18,66 L82,66 L78,88 C78,91 75,93 72,93 L28,93 C25,93 22,91 22,88 Z"
        fill={color}
      />
      
      {/* Headlights */}
      <Circle
        cx="28"
        cy="78"
        r="8"
        fill="#FFFFFF"
        stroke="#191919"
        strokeWidth="2.5"
      />
      <Circle cx="28" cy="78" r="4.5" fill="#3B82F6" />

      <Circle
        cx="72"
        cy="78"
        r="8"
        fill="#FFFFFF"
        stroke="#191919"
        strokeWidth="2.5"
      />
      <Circle cx="72" cy="78" r="4.5" fill="#3B82F6" />

      {/* Front bumper grille */}
      <Rect
        x="40"
        y="72"
        width="20"
        height="12"
        rx="2"
        fill="#1E1E1E"
        stroke="#FFFFFF"
        strokeWidth="1.5"
      />
      
      {/* Wheels/Tires at the bottom */}
      <Rect x="26" y="93" width="10" height="7" rx="1.5" fill="#1E1E1E" />
      <Rect x="64" y="93" width="10" height="7" rx="1.5" fill="#1E1E1E" />
    </Svg>
  );
}
