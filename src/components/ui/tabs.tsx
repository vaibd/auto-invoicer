"use client"

import * as React from "react"
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs"

import { cn } from "@/lib/utils"

const Tabs = React.forwardRef<
  HTMLDivElement,
  TabsPrimitive.Root.Props
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Root
    ref={ref}
    data-slot="tabs"
    className={cn("flex flex-col", className)}
    {...props}
  />
))
Tabs.displayName = "Tabs"

const TabsList = React.forwardRef<
  HTMLDivElement,
  TabsPrimitive.List.Props
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    data-slot="tabs-list"
    className={cn(
      "relative flex items-center gap-1 rounded-lg bg-muted p-1",
      className
    )}
    {...props}
  />
))
TabsList.displayName = "TabsList"

const TabsTrigger = React.forwardRef<
  HTMLElement,
  TabsPrimitive.Tab.Props
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Tab
    ref={ref}
    data-slot="tabs-trigger"
    className={cn(
      "flex-1 cursor-pointer rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors select-none",
      "hover:text-foreground",
      "data-[active]:bg-primary data-[active]:text-primary-foreground data-[active]:shadow-sm",
      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
      "disabled:pointer-events-none disabled:opacity-50",
      className
    )}
    {...props}
  />
))
TabsTrigger.displayName = "TabsTrigger"

const TabsContent = React.forwardRef<
  HTMLDivElement,
  TabsPrimitive.Panel.Props
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Panel
    ref={ref}
    data-slot="tabs-content"
    className={cn("mt-3 focus-visible:outline-none", className)}
    {...props}
  />
))
TabsContent.displayName = "TabsContent"

const TabsIndicator = React.forwardRef<
  HTMLSpanElement,
  TabsPrimitive.Indicator.Props
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Indicator
    ref={ref}
    data-slot="tabs-indicator"
    className={cn(
      "absolute rounded-md bg-background shadow-sm transition-all duration-200",
      className
    )}
    {...props}
  />
))
TabsIndicator.displayName = "TabsIndicator"

export { Tabs, TabsList, TabsTrigger, TabsContent, TabsIndicator }
