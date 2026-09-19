import React from 'react'
import clsx from 'clsx'
import Container from './Container'

export function Section({
  as: Element = 'section',
  className,
  containerClassName,
  children,
  ...props
}) {
  return (
    <Element className={clsx('py-14 md:py-24', className)} {...props}>
      <Container className={containerClassName}>{children}</Container>
    </Element>
  )
}

export default Section
