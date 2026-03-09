import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

// Reduce padding and font size for a smaller, less bulky button appearance
export const buttonVariants = cva(
  "leading-none text-white transition-all disabled:bg-slate-300 text-sm cursor-pointer ", // text-sm is default, can be overridden in variants if needed
  {
    variants: {
      variant: {
        primarybtn:
          "rounded-md bg-primary text-white py-1.5 px-3 md:px-5 md:py-2.5 hover:bg-primary/90 transition-all text-sm md:text-base",
        outlineBtn:
          "rounded-md bg-transparent text-blue-700 border border-primary py-1.5 px-3 md:px-5 md:py-2.5 hover:bg-blue-50 hover:border-blue-700 transition-all text-sm md:text-base",
        textBtn:
          "rounded-md bg-transparent text-blue-700 py-1.5 px-3 md:px-5 md:py-2.5 hover:bg-blue-50 transition-all text-sm md:text-base",
        paginationBtn:
          "rounded-full border bg-primary px-2 py-1 text-white text-sm",
        ghostBtn:
          "rounded-full border border-blue-700 text-blue-700 bg-white px-2 py-1 hover:bg-blue-50 transition-all text-sm",
        ghost: "hover:bg-accent hover:text-accent-foreground",
      },
      size: {
        sm: "text-xs px-2 py-1",
        md: "text-sm px-3 py-1.5", // default
        lg: "text-base px-5 py-2.5",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "primarybtn",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  label?: string;
  icon?: React.ReactNode;
  reverse?: boolean;
  children?: React.ReactNode;
}

const ButtonComponent: React.FC<ButtonProps> = ({
  variant,
  size,
  className,
  label,
  icon,
  reverse = false,
  children,
  ...props
}: ButtonProps) => {
  // If children are provided, use them directly (for sidebar compatibility)
  if (children) {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      >
        {children}
      </button>
    );
  }

  // Otherwise use the label/icon API
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    >
      <div
        className={cn(
          icon &&
            `flex justify-center items-center gap-2 ${
              reverse ? "flex-row-reverse" : "flex-row"
            }`
        )}
      >
        <span className="whitespace-nowrap">{label}</span>
        {icon && <span>{icon}</span>}
      </div>
    </button>
  );
};

// Named export for compatibility with sidebar and other components
export const Button = ButtonComponent;

export default ButtonComponent;
