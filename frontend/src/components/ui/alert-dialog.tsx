'use client'

/**
 * Alert Dialog Component
 * 
 * A modal dialog for confirmations and alerts
 */

import * as React from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './dialog'
import { Button } from './button'

interface AlertDialogContextValue {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const AlertDialogContext = React.createContext<AlertDialogContextValue | undefined>(undefined)

function useAlertDialogContext() {
  const context = React.useContext(AlertDialogContext)
  if (!context) {
    throw new Error('AlertDialog components must be used within AlertDialog')
  }
  return context
}

export function AlertDialog({
  children,
  open,
  onOpenChange,
}: {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  
  const isControlled = open !== undefined
  const dialogOpen = isControlled ? open : internalOpen
  const setDialogOpen = isControlled ? onOpenChange || (() => {}) : setInternalOpen

  return (
    <AlertDialogContext.Provider value={{ open: dialogOpen, onOpenChange: setDialogOpen }}>
      {children}
    </AlertDialogContext.Provider>
  )
}

export function AlertDialogTrigger({
  children,
  asChild,
}: {
  children: React.ReactNode
  asChild?: boolean
}) {
  const { onOpenChange } = useAlertDialogContext()

  if (asChild && React.isValidElement(children)) {
    const child = children as React.ReactElement<{
      onClick?: (event: React.MouseEvent) => void
    }>
    return React.cloneElement(child, {
      onClick: (e: React.MouseEvent) => {
        child.props.onClick?.(e)
        onOpenChange(true)
      },
    })
  }

  return (
    <button
      type="button"
      className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background rounded-md"
      onClick={() => onOpenChange(true)}
    >
      {children}
    </button>
  )
}

export function AlertDialogContent({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  const { open, onOpenChange } = useAlertDialogContext()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={className}>{children}</DialogContent>
    </Dialog>
  )
}

export function AlertDialogHeader({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogHeader className={className}>{children}</DialogHeader>
}

export function AlertDialogTitle({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogTitle className={className}>{children}</DialogTitle>
}

export function AlertDialogDescription({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return <DialogDescription className={className}>{children}</DialogDescription>
}

export function AlertDialogFooter({
  children,
  className,
}: {
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className || ''}`}>
      {children}
    </div>
  )
}

export function AlertDialogCancel({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const { onOpenChange } = useAlertDialogContext()

  return (
    <Button
      variant="outline"
      onClick={() => {
        onClick?.()
        onOpenChange(false)
      }}
      className={className}
    >
      {children}
    </Button>
  )
}

export function AlertDialogAction({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}) {
  const { onOpenChange } = useAlertDialogContext()

  return (
    <Button
      onClick={() => {
        onClick?.()
        onOpenChange(false)
      }}
      className={className}
    >
      {children}
    </Button>
  )
}

