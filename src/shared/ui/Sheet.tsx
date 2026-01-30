import * as React from "react"
import { Drawer } from "vaul"
import { cn } from "../lib/utils"

const Sheet = ({
  children,
  ...props
}: React.ComponentProps<typeof Drawer.Root>) => (
  <Drawer.Root shouldScaleBackground={false} {...props}>
    {children}
  </Drawer.Root>
)
Sheet.displayName = "Sheet"

const SheetTrigger = Drawer.Trigger

const SheetClose = Drawer.Close

const SheetPortal = Drawer.Portal

const SheetOverlay = React.forwardRef<
  React.ElementRef<typeof Drawer.Overlay>,
  React.ComponentPropsWithoutRef<typeof Drawer.Overlay>
>(({ className, ...props }, ref) => (
  <Drawer.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/60", className)}
    {...props}
  />
))
SheetOverlay.displayName = "SheetOverlay"

const SheetContent = React.forwardRef<
  React.ElementRef<typeof Drawer.Content>,
  React.ComponentPropsWithoutRef<typeof Drawer.Content> & {
    maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "4xl" | "5xl" | "full"
    hideHandle?: boolean
  }
>(({ className, children, maxWidth = "2xl", hideHandle = false, ...props }, ref) => {
  const maxWidthClass = {
    sm: "max-w-sm",
    md: "max-w-md",
    lg: "max-w-lg",
    xl: "max-w-xl",
    "2xl": "max-w-2xl",
    "3xl": "max-w-3xl",
    "4xl": "max-w-4xl",
    "5xl": "max-w-5xl",
    full: "max-w-full",
  }[maxWidth]

  return (
    <SheetPortal>
      <SheetOverlay />
      <Drawer.Content
        ref={ref}
        className={cn(
          "fixed bottom-0 inset-x-0 z-50 mx-auto flex h-auto max-h-[96%] flex-col rounded-t-[32px] border-t bg-white outline-none",
          maxWidthClass,
          className
        )}
        {...props}
      >
        {!hideHandle && (
          <div className="mx-auto mt-4 h-1.5 w-12 shrink-0 rounded-full bg-surface-200" />
        )}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </Drawer.Content>
    </SheetPortal>
  )
})
SheetContent.displayName = "SheetContent"

const SheetHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col space-y-2 text-center sm:text-left p-6 pb-0",
      className
    )}
    {...props}
  />
)
SheetHeader.displayName = "SheetHeader"

const SheetFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={cn(
      "flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 p-6",
      className
    )}
    {...props}
  />
)
SheetFooter.displayName = "SheetFooter"

const SheetTitle = React.forwardRef<
  React.ElementRef<typeof Drawer.Title>,
  React.ComponentPropsWithoutRef<typeof Drawer.Title>
>(({ className, ...props }, ref) => (
  <Drawer.Title
    ref={ref}
    className={cn("text-lg font-medium text-surface-900", className)}
    {...props}
  />
))
SheetTitle.displayName = "SheetTitle"

const SheetDescription = React.forwardRef<
  React.ElementRef<typeof Drawer.Description>,
  React.ComponentPropsWithoutRef<typeof Drawer.Description>
>(({ className, ...props }, ref) => (
  <Drawer.Description
    ref={ref}
    className={cn("text-sm text-surface-600 font-medium", className)}
    {...props}
  />
))
SheetDescription.displayName = "SheetDescription"

export {
  Sheet,
  SheetPortal,
  SheetOverlay,
  SheetTrigger,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetFooter,
  SheetTitle,
  SheetDescription,
}
