"use client";

import * as React from "react";
import * as SelectPrimitive from "@radix-ui/react-select";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/app/lib/utils";

const Select = React.forwardRef<
  HTMLDivElement,
  {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    className?: string;
  }
>(({ value, onValueChange, options, className }, ref) => (
  <SelectPrimitive.Root value={value} onValueChange={onValueChange}>
    <SelectPrimitive.Trigger
      ref={ref}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-md border border-dark-border bg-dark-surface px-3 py-2 text-sm text-text-primary ring-offset-background placeholder:text-text-tertiary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
    >
      <SelectPrimitive.Value>
        {options.find(option => option.value === value)?.label || value}
      </SelectPrimitive.Value>
      <SelectPrimitive.Icon>
        <ChevronDown className="h-4 w-4 opacity-50" />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        className="relative z-50 min-w-[8rem] overflow-hidden rounded-md border border-dark-border bg-dark-surface text-text-primary shadow-md animate-in fade-in-80"
      >
        <SelectPrimitive.Viewport className="p-1">
          {options.map((option) => (
            <SelectPrimitive.Item
              key={option.value}
              value={option.value}
              className={cn(
                "relative flex cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-dark-surface-lighter data-[disabled]:pointer-events-none data-[disabled]:opacity-50",
                value === option.value && "bg-dark-surface-lighter"
              )}
            >
              <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
                <SelectPrimitive.ItemIndicator>
                  <Check className="h-4 w-4" />
                </SelectPrimitive.ItemIndicator>
              </span>
              <SelectPrimitive.ItemText>{option.label}</SelectPrimitive.ItemText>
            </SelectPrimitive.Item>
          ))}
        </SelectPrimitive.Viewport>
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  </SelectPrimitive.Root>
));
Select.displayName = "Select";

export { Select }; 