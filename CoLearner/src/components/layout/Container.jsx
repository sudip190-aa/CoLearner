import React from 'react'
import clsx from 'clsx'

export function Container({
  as: Element = 'div',
  className,
  children,
  ...props
}) {
  return (
    <Element
      className={clsx('mx-auto w-full max-w-content px-6', className)}
      {...props}
    >
      {children}
    </Element>
  )
}

export default Container
