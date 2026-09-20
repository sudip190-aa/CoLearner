import React from 'react'
import { Link } from 'react-router-dom'
import clsx from 'clsx'
import logoSrc from '../../assets/logo.png'
import darkLogoSrc from '../../assets/logo2.svg'

export const LOGO_SRC = logoSrc

/*
 * The official logo asset is a 2276×2276 square PNG whose drawn "C LEARN"
 * lockup occupies only the inner 1716×773 box — the remainder is fully
 * transparent padding.
 *
 * We must never re-export, crop or redraw the master file, so the transparent
 * margin is removed at render time instead: the <img> is scaled up and shifted
 * inside a clipping wrapper until its ink box exactly fills a box of the
 * requested height. That makes `size` mean "visible height of the mark",
 * which is what every caller actually expects.
 *
 *   source canvas : 2276 × 2276
 *   ink box       : x 281 → 1997 (w 1716) · y 793 → 1566 (h 773)
 */
const SRC_SIZE = 2276
const INK_BOX = { x: 281, y: 793, w: 1716, h: 773 }

// Requested *visible* height of the lockup, in px.
const SIZE_MAP = {
  xs: { height: 18, textClass: 'text-sm' },
  sm: { height: 22, textClass: 'text-base' },
  md: { height: 28, textClass: 'text-xl' },
  nav: { height: 32, textClass: 'text-2xl' },
  lg: { height: 42, textClass: 'text-2xl' },
  xl: { height: 56, textClass: 'text-3xl' },
}

/** Both supplied assets share the same square canvas and lockup bounds. */
function LockupImage({ height, priority }) {
  // Scale the square source so the drawn lockup ends up exactly `height` tall.
  const imgSize = (height * SRC_SIZE) / INK_BOX.h
  const boxWidth = (height * INK_BOX.w) / INK_BOX.h
  const imageStyle = {
    width: imgSize,
    height: imgSize,
    left: -(INK_BOX.x / SRC_SIZE) * imgSize,
    top: -(INK_BOX.y / SRC_SIZE) * imgSize,
  }

  return (
    <span
      className="relative block shrink-0 overflow-hidden"
      style={{ height, width: boxWidth }}
    >
      <img
        src={logoSrc}
        alt="Colearn"
        draggable="false"
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        className="absolute max-w-none select-none dark:hidden"
        style={imageStyle}
      />
      <img
        src={darkLogoSrc}
        alt="Colearn"
        draggable="false"
        loading={priority ? 'eager' : 'lazy'}
        fetchpriority={priority ? 'high' : 'auto'}
        className="absolute hidden max-w-none select-none dark:block"
        style={imageStyle}
      />
    </span>
  )
}

export function Logo({
  variant = 'full',
  size = 'md',
  to,
  className,
  priority = true,
  ...props
}) {
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.md

  // logo.png already contains the complete visual "C LEARN" lockup, so both
  // 'full' and 'mark' render the same asset (mark is not a separate cut).
  const renderContent = () => {
    if (variant === 'wordmark') {
      return (
        <span
          className={clsx(
            'font-bold tracking-tight text-c-text select-none font-sans',
            sizeConfig.textClass,
          )}
        >
          Colearn
        </span>
      )
    }

    return <LockupImage height={sizeConfig.height} priority={priority} />
  }

  const containerClasses = clsx(
    'inline-flex items-center gap-2 focus-visible:rounded-md transition-opacity hover:opacity-95',
    className,
  )

  if (to) {
    return (
      <Link to={to} className={containerClasses} {...props}>
        {renderContent()}
      </Link>
    )
  }

  return (
    <div className={containerClasses} {...props}>
      {renderContent()}
    </div>
  )
}

export default Logo
