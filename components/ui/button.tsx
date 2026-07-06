import { forwardRef, type ButtonHTMLAttributes } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/50 focus-visible:ring-offset-2 focus-visible:ring-offset-void disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none",
  {
    variants: {
      variant: {
        gold: "rounded-full bg-gold text-void hover:bg-gold-glow btn-glow",
        crimson: "rounded-full bg-crimson text-bone hover:brightness-110 hover:shadow-crimson-glow",
        outline:
          "rounded-full border border-white/15 bg-white/[0.03] text-bone hover:border-gold/40 hover:bg-gold/10 hover:text-gold",
        ghost: "rounded-lg text-ash hover:bg-white/[0.04] hover:text-bone",
      },
      size: {
        sm: "h-9 px-4 text-xs",
        md: "h-11 px-6 text-sm",
        lg: "h-12 px-8 text-[15px]",
        icon: "h-10 w-10 rounded-xl",
      },
    },
    defaultVariants: { variant: "gold", size: "md" },
  }
);

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...props} />
  )
);
Button.displayName = "Button";

export { buttonVariants };