/**
 * Frontend Color Utility Functions for Option Chain
 * Applies background colors and ATM styling
 */

/**
 * Get background color style for volume cells
 */
export function getVolumeBackgroundColor(color: string): React.CSSProperties {
  const isLightBackground = ['#c8e6c9', '#ffcdd2', '#f8bbd0', '#ffeb3b'].includes(color);
  
  return {
    backgroundColor: color === 'transparent' ? 'inherit' : color,
    color: isLightBackground ? '#000000' : 'inherit', // Dark text for light backgrounds
    fontWeight: isLightBackground ? 500 : 'inherit',
  };
}

/**
 * Get background color style for OI cells with fade animation
 */
export function getOIBackgroundColor(
  color: string,
  shouldFade: boolean
): React.CSSProperties {
  const isLightBackground = ['#c8e6c9', '#ffcdd2', '#f8bbd0', '#ffeb3b'].includes(color);
  
  const baseStyle: React.CSSProperties = {
    backgroundColor: color === 'transparent' ? 'inherit' : color,
    color: isLightBackground ? '#000000' : 'inherit', // Dark text for light backgrounds
    fontWeight: isLightBackground ? 500 : 'inherit',
  };

  if (shouldFade && color === '#ffeb3b') {
    // Yellow fade animation
    return {
      ...baseStyle,
      animation: 'fadeOut 3s ease-out forwards',
    };
  }

  return baseStyle;
}

/**
 * Get color for built-up classification badge
 */
export function getBuiltUpColor(classification: 'LB' | 'SB' | 'LU' | 'SC'): string {
  const colors: { [key: string]: string } = {
    LB: '#4caf50', // Green
    SB: '#f44336', // Red
    LU: '#ff9800', // Orange
    SC: '#c8e6c9', // Light Green
  };
  return colors[classification] || '#ffffff';
}

/**
 * Get style for ATM (At-The-Money) strike row
 */
export function getATMStyle(isATM: boolean): React.CSSProperties {
  if (!isATM) {
    return {};
  }

  return {
    borderBottom: '3px solid #FFD700', // Golden underline
    fontWeight: 'bold',
  };
}

/**
 * Get style for highest values (bold font)
 */
export function getHighestValueStyle(isHighest: boolean): React.CSSProperties {
  return {
    fontWeight: isHighest ? 'bold' : 'normal',
  };
}

/**
 * CSS keyframes for fade animation
 * Add this to your global CSS or styled component
 */
export const fadeOutKeyframes = `
@keyframes fadeOut {
  0% {
    background-color: #ffeb3b;
    opacity: 1;
  }
  100% {
    background-color: transparent;
    opacity: 0;
  }
}
`;
