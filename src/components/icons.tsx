import type { SVGProps } from 'react';

export const SnbdLogo = (props: SVGProps<SVGSVGElement>) => (
  // Using a simple text-based SVG logo for SNBD Host
  // You can replace this with an actual SVG path if you have one
  <svg viewBox="0 0 200 50" xmlns="http://www.w3.org/2000/svg" {...props}>
    <text 
      x="10" 
      y="35" 
      fontFamily="Inter, sans-serif" 
      fontSize="30" 
      fontWeight="bold" 
      fill="hsl(var(--primary))"
    >
      SNBD
    </text>
    <text 
      x="105" 
      y="35" 
      fontFamily="Inter, sans-serif" 
      fontSize="30" 
      fontWeight="normal" 
      fill="hsl(var(--foreground))"
    >
      Host
    </text>
  </svg>
);

// Placeholder for other custom icons if needed in future.
// For now, we rely on lucide-react.
