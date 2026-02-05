import * as React from 'react';
import { cn } from '@/lib/utils';

// Note: I am simulating the cva/slot utility usually found in shadcn/ui
// but implementing it raw to save "npx shadcn-ui@latest add button" overhead
// since I just need basic buttons.
// Wait, I need to install class-variance-authority and @radix-ui/react-slot if I use them.
// I did NOT install them. I will use a simpler button for now to avoid extra installs unless necessary.
// Rewriting to not use cva/radix for now, just simple props.

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'gold';
  size?: 'default' | 'sm' | 'lg';
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ className, variant = 'default', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
        {
          'bg-zinc-900 text-zinc-50 hover:bg-zinc-900/90': variant === 'default',
          'border border-zinc-200 bg-white hover:bg-zinc-100 hover:text-zinc-900': variant === 'outline',
          'bg-gold text-black hover:bg-gold-dim': variant === 'gold',
          'hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50': variant === 'ghost',
          'h-10 px-4 py-2': size === 'default',
          'h-9 rounded-md px-3': size === 'sm',
          'h-11 rounded-md px-8': size === 'lg',
        },
        className,
      )}
      {...props}
    />
  );
});
Button.displayName = 'Button';

export { Button };
