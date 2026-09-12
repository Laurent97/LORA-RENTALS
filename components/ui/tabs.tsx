"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface TabsProps {
  value: string;
  onValueChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}

export function Tabs({ value, onValueChange, children, className }: TabsProps) {
  return (
    <div className={className} data-tab-value={value}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { __value: value, __onChange: onValueChange })
          : child
      )}
    </div>
  );
}

export function TabsList({
  children,
  className,
  __value,
  __onChange,
}: {
  children: React.ReactNode;
  className?: string;
  __value?: string;
  __onChange?: (v: string) => void;
}) {
  return (
    <div className={cn("inline-flex flex-wrap items-center gap-1 rounded-xl bg-muted p-1", className)}>
      {React.Children.map(children, (child) =>
        React.isValidElement(child)
          ? React.cloneElement(child as React.ReactElement<any>, { __value, __onChange })
          : child
      )}
    </div>
  );
}

export function TabsTrigger({
  value,
  children,
  className,
  __value,
  __onChange,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  __value?: string;
  __onChange?: (v: string) => void;
}) {
  const active = __value === value;
  return (
    <button
      onClick={() => __onChange?.(value)}
      className={cn(
        "rounded-lg px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-card text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({
  value,
  children,
  className,
  __value,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  __value?: string;
}) {
  if (__value !== value) return null;
  return <div className={cn("mt-4", className)}>{children}</div>;
}
