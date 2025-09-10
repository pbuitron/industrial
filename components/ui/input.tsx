import * as React from "react"

import { cn } from "@/lib/utils"

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    // Filtrar props problemáticos que pueden venir de extensiones del navegador
    const cleanProps = React.useMemo(() => {
      const { 
        fdprocessedid, 
        'data-lastpass-icon-root': lastpassIcon,
        'data-form-type': formType,
        'data-lpignore': lpIgnore,
        'data-1p-ignore': onePasswordIgnore,
        ...restProps 
      } = props as any
      return restProps
    }, [props])

    return (
      <input
        type={type}
        className={cn(
          "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        suppressHydrationWarning
        {...cleanProps}
      />
    )
  }
)

Input.displayName = "Input"

export { Input }