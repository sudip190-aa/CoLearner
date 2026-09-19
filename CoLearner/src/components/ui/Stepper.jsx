import React, { forwardRef } from 'react'
import clsx from 'clsx'
import { Check } from 'lucide-react'

export const Stepper = forwardRef(function Stepper(
  {
    steps = [], // [{ title: 'Profile', description: 'Personal details' }, ...]
    currentStep = 0, // 0-indexed
    onStepClick,
    className,
    ...props
  },
  ref,
) {
  return (
    <div
      ref={ref}
      className={clsx('w-full flex items-center justify-between', className)}
      {...props}
    >
      {steps.map((step, index) => {
        const isCompleted = index < currentStep
        const isActive = index === currentStep
        const isUpcoming = index > currentStep
        const isClickable = Boolean(onStepClick) && (isCompleted || isActive)

        return (
          <React.Fragment key={step.title || index}>
            {/* Step Node */}
            <div
              onClick={isClickable ? () => onStepClick(index) : undefined}
              className={clsx(
                'flex items-center gap-3 select-none',
                isClickable && 'cursor-pointer group',
              )}
            >
              {/* Circle Indicator */}
              <div
                className={clsx(
                  'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all shrink-0',
                  isCompleted && 'bg-c-blue text-white shadow-xs',
                  // Yellow Law: yellow always uses dark text.
                  isActive &&
                    'bg-c-yellow text-c-text border-2 border-c-text/10 shadow-sm ring-4 ring-c-yellow-soft',
                  isUpcoming &&
                    'bg-slate-100 text-c-text-muted border border-c-border',
                )}
              >
                {isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  index + 1
                )}
              </div>

              {/* Text info */}
              <div className="hidden sm:flex flex-col text-left">
                <span
                  className={clsx(
                    'text-xs font-bold leading-tight',
                    isActive
                      ? 'text-c-text'
                      : isCompleted
                        ? 'text-c-blue'
                        : 'text-c-text-muted',
                  )}
                >
                  {step.title}
                </span>
                {step.description && (
                  <span className="text-[11px] text-c-text-muted leading-tight mt-0.5">
                    {step.description}
                  </span>
                )}
              </div>
            </div>

            {/* Connecting Line between steps */}
            {index < steps.length - 1 && (
              <div
                className={clsx(
                  'flex-1 h-0.5 mx-3 sm:mx-4 transition-colors',
                  index < currentStep ? 'bg-c-blue' : 'bg-c-border',
                )}
              />
            )}
          </React.Fragment>
        )
      })}
    </div>
  )
})

Stepper.displayName = 'Stepper'
export default Stepper
