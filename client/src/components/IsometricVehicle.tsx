import React from "react";
import { VehicleType } from "@/data/motionBasedGameData";

interface IsometricVehicleProps {
  type: VehicleType;
  color: string;
  size?: number;
}

export const IsometricVehicle: React.FC<IsometricVehicleProps> = ({
  type,
  color,
  size = 40,
}) => {
  const renderVehicle = () => {
    switch (type) {
      case "sedan":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric sedan - top view */}
            <g>
              {/* Main body */}
              <polygon
                points="15,20 45,20 50,35 10,35"
                fill={color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Roof */}
              <polygon
                points="20,20 40,20 42,28 18,28"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Front windshield */}
              <polygon
                points="25,28 35,28 33,32 27,32"
                fill="#87CEEB"
                stroke="#000"
                strokeWidth="0.5"
              />
              {/* Wheels */}
              <circle cx="22" cy="38" r="3" fill="#333" />
              <circle cx="38" cy="38" r="3" fill="#333" />
            </g>
          </svg>
        );

      case "suv":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric SUV */}
            <g>
              {/* Main body - taller */}
              <polygon
                points="12,22 48,22 52,36 8,36"
                fill={color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Roof */}
              <polygon
                points="18,22 42,22 44,28 16,28"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Windows */}
              <polygon
                points="22,28 38,28 36,32 24,32"
                fill="#87CEEB"
                stroke="#000"
                strokeWidth="0.5"
              />
              {/* Wheels */}
              <circle cx="20" cy="40" r="3.5" fill="#333" />
              <circle cx="40" cy="40" r="3.5" fill="#333" />
            </g>
          </svg>
        );

      case "truck":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric truck */}
            <g>
              {/* Cab */}
              <polygon
                points="12,25 28,25 30,32 10,32"
                fill={color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Cargo bed */}
              <polygon
                points="28,25 52,25 54,35 30,35"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.9"
              />
              {/* Cab roof */}
              <polygon
                points="16,25 26,25 27,29 15,29"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Windshield */}
              <polygon
                points="18,29 24,29 23,31 19,31"
                fill="#87CEEB"
                stroke="#000"
                strokeWidth="0.5"
              />
              {/* Wheels */}
              <circle cx="18" cy="38" r="3.5" fill="#333" />
              <circle cx="46" cy="38" r="3.5" fill="#333" />
            </g>
          </svg>
        );

      case "van":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric van */}
            <g>
              {/* Main body - boxy */}
              <polygon
                points="10,22 50,22 52,36 8,36"
                fill={color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Roof */}
              <polygon
                points="14,22 46,22 48,28 12,28"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Side windows */}
              <rect x="20" y="28" width="8" height="4" fill="#87CEEB" stroke="#000" strokeWidth="0.5" />
              <rect x="32" y="28" width="8" height="4" fill="#87CEEB" stroke="#000" strokeWidth="0.5" />
              {/* Wheels */}
              <circle cx="18" cy="40" r="3.5" fill="#333" />
              <circle cx="42" cy="40" r="3.5" fill="#333" />
            </g>
          </svg>
        );

      case "bus":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric bus */}
            <g>
              {/* Main body - long */}
              <polygon
                points="8,24 52,24 54,36 6,36"
                fill={color}
                stroke="#000"
                strokeWidth="1"
              />
              {/* Roof */}
              <polygon
                points="12,24 48,24 50,30 10,30"
                fill={color}
                stroke="#000"
                strokeWidth="1"
                opacity="0.8"
              />
              {/* Windows */}
              <rect x="16" y="30" width="6" height="3" fill="#87CEEB" stroke="#000" strokeWidth="0.5" />
              <rect x="26" y="30" width="6" height="3" fill="#87CEEB" stroke="#000" strokeWidth="0.5" />
              <rect x="36" y="30" width="6" height="3" fill="#87CEEB" stroke="#000" strokeWidth="0.5" />
              {/* Wheels */}
              <circle cx="16" cy="40" r="3.5" fill="#333" />
              <circle cx="44" cy="40" r="3.5" fill="#333" />
            </g>
          </svg>
        );

      case "motorcycle":
        return (
          <svg width={size} height={size} viewBox="0 0 60 60" className="drop-shadow-lg">
            {/* Isometric motorcycle */}
            <g>
              {/* Body */}
              <ellipse cx="30" cy="28" rx="8" ry="12" fill={color} stroke="#000" strokeWidth="1" />
              {/* Handlebars */}
              <line x1="28" y1="18" x2="32" y2="18" stroke="#000" strokeWidth="2" />
              {/* Wheels */}
              <circle cx="18" cy="38" r="4" fill="#333" />
              <circle cx="42" cy="38" r="4" fill="#333" />
              {/* Seat */}
              <ellipse cx="30" cy="25" rx="6" ry="3" fill={color} stroke="#000" strokeWidth="0.5" opacity="0.9" />
            </g>
          </svg>
        );

      default:
        return null;
    }
  };

  return <div className="flex items-center justify-center">{renderVehicle()}</div>;
};
