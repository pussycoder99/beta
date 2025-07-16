import type { SVGProps } from 'react';
import Image from 'next/image';

export const SnbdLogo = (props: React.ComponentProps<typeof Image>) => {
  // This component is being deprecated in favor of using <Image> directly
  // It is kept for backwards compatibility in case it's used somewhere unexpectedly.
  // New implementations should use <Image> directly with the src URL.
  return (
    <Image 
      src="https://snbdhost.com/wp-content/uploads/2025/05/Untitled-design-6.png"
      alt="SNBD Host Logo"
      width={150}
      height={40}
      {...props}
    />
  );
};


// Placeholder for other custom icons if needed in future.
// For now, we rely on lucide-react.
