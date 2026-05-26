import * as React from "react"
import * as SwitchPrimitives from "@radix-ui/react-switch"

import { cn } from "@/lib/utils"

const Switch = React.forwardRef<
    React.ElementRef<typeof SwitchPrimitives.Root>,
    React.ComponentPropsWithoutRef<typeof SwitchPrimitives.Root>
>(({ className, ...props }, ref) => (
    <SwitchPrimitives.Root
        className={cn(
            "peer inline-flex h-[28px] w-[48px] shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors duration-200 ease-[cubic-bezier(0.4,0,0.2,1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-40 data-[state=checked]:bg-primary data-[state=unchecked]:bg-input",
        )}
        {...props}
        ref={ref}
    >
        <SwitchPrimitives.Thumb
            className={cn(
               "pointer-events-none block h-[22px] w-[22px] rounded-full bg-white ml-[3px] shadow-[0_1px_4px_rgba(0,0,0,0.18),0_0_0_0.5px_rgba(0,0,0,0.08)] ring-0 transition-transform duration-200 ease-[cubic-bezier(0.34,1.56,0.64,1)] data-[state=checked]:translate-x-[20px] data-[state=unchecked]:translate-x-0"
            )}
        />
    </SwitchPrimitives.Root>
))
Switch.displayName = SwitchPrimitives.Root.displayName

export { Switch }