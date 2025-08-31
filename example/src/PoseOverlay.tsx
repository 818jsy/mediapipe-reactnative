import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Circle, Line, G } from 'react-native-svg';

// MediaPipe pose landmark connections
const POSE_CONNECTIONS = [
  // Face
  [0, 1], [1, 2], [2, 3], [3, 7], [0, 4], [4, 5], [5, 6], [6, 8],
  // Arms
  [9, 10], [11, 12], [11, 13], [13, 15], [15, 17], [15, 19], [15, 21], [17, 19],
  [12, 14], [14, 16], [16, 18], [16, 20], [16, 22], [18, 20],
  // Body
  [11, 23], [12, 24], [23, 24],
  // Legs
  [23, 25], [24, 26], [25, 27], [26, 28], [27, 29], [28, 30], [29, 31], [30, 32], [27, 31], [28, 32]
];

interface Landmark {
  x: number;
  y: number;
  z: number;
  visibility: number;
}

interface PoseOverlayProps {
  landmarks: Landmark[];
  imageWidth: number;
  imageHeight: number;
  displayWidth: number;
  displayHeight: number;
}

const PoseOverlay: React.FC<PoseOverlayProps> = ({
  landmarks,
  imageWidth,
  imageHeight,
  displayWidth,
  displayHeight,
}) => {
  if (!landmarks || landmarks.length === 0) {
    return null;
  }

  // Calculate scale factors
  const scaleX = displayWidth / imageWidth;
  const scaleY = displayHeight / imageHeight;

  // Convert normalized coordinates to display coordinates
  const getDisplayCoordinates = (landmark: Landmark) => {
    return {
      x: landmark.x * imageWidth * scaleX,
      y: landmark.y * imageHeight * scaleY,
    };
  };

  // Filter visible landmarks
  const visibleLandmarks = landmarks.filter(landmark => 
    landmark.visibility > 0.5 // Only show landmarks with good visibility
  );

  return (
    <View style={[styles.overlay, { width: displayWidth, height: displayHeight }]}>
      <Svg width={displayWidth} height={displayHeight}>
        <G>
          {/* Draw connections */}
          {POSE_CONNECTIONS.map(([startIdx, endIdx], index) => {
            if (
              startIdx < landmarks.length && 
              endIdx < landmarks.length &&
              landmarks[startIdx].visibility > 0.5 &&
              landmarks[endIdx].visibility > 0.5
            ) {
              const start = getDisplayCoordinates(landmarks[startIdx]);
              const end = getDisplayCoordinates(landmarks[endIdx]);
              
              return (
                <Line
                  key={`connection-${index}`}
                  x1={start.x}
                  y1={start.y}
                  x2={end.x}
                  y2={end.y}
                  stroke="#00FF00"
                  strokeWidth="2"
                  opacity="0.8"
                />
              );
            }
            return null;
          })}
          
          {/* Draw landmarks */}
          {visibleLandmarks.map((landmark, index) => {
            const coords = getDisplayCoordinates(landmark);
            const originalIndex = landmarks.indexOf(landmark);
            
            // Different colors for different body parts
            let color = '#FF0000'; // Default red
            if (originalIndex >= 0 && originalIndex <= 10) {
              color = '#FFD700'; // Gold for face
            } else if (originalIndex >= 11 && originalIndex <= 22) {
              color = '#00BFFF'; // Blue for arms and torso
            } else if (originalIndex >= 23 && originalIndex <= 32) {
              color = '#FF69B4'; // Pink for legs
            }
            
            return (
              <Circle
                key={`landmark-${originalIndex}`}
                cx={coords.x}
                cy={coords.y}
                r="4"
                fill={color}
                stroke="white"
                strokeWidth="1"
                opacity="0.9"
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
});

export default PoseOverlay;
