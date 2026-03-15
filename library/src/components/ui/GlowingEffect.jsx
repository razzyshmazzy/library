import { memo, useCallback, useEffect, useRef } from 'react'

const GlowingEffect = memo(({
  inactiveZone = 0.7,
  proximity = 64,
  spread = 20,
  borderWidth = 2,
  disabled = false,
}) => {
  const ref = useRef(null)
  const lastPosition = useRef({ x: 0, y: 0 })
  const rafRef = useRef(null)

  const handleMove = useCallback((e) => {
    if (!ref.current) return
    if (rafRef.current) cancelAnimationFrame(rafRef.current)

    rafRef.current = requestAnimationFrame(() => {
      const el = ref.current
      if (!el) return

      const { left, top, width, height } = el.getBoundingClientRect()
      const mouseX = e?.x ?? lastPosition.current.x
      const mouseY = e?.y ?? lastPosition.current.y

      if (e) lastPosition.current = { x: mouseX, y: mouseY }

      const centerX = left + width / 2
      const centerY = top + height / 2
      const distanceFromCenter = Math.hypot(mouseX - centerX, mouseY - centerY)
      const inactiveRadius = 0.5 * Math.min(width, height) * inactiveZone

      if (distanceFromCenter < inactiveRadius) {
        el.style.setProperty('--active', '0')
        return
      }

      const isNear =
        mouseX > left - proximity &&
        mouseX < left + width + proximity &&
        mouseY > top - proximity &&
        mouseY < top + height + proximity

      const angle = (Math.atan2(mouseY - centerY, mouseX - centerX) * 180) / Math.PI + 90

      el.style.setProperty('--active', isNear ? '1' : '0')
      el.style.setProperty('--start', `${angle}deg`)
    })
  }, [inactiveZone, proximity])

  useEffect(() => {
    if (disabled) return
    window.addEventListener('pointermove', handleMove)
    return () => {
      window.removeEventListener('pointermove', handleMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [handleMove, disabled])

  if (disabled) return null

  return (
    <div
      ref={ref}
      className="glow-border"
      style={{
        '--spread': spread,
        '--glowingeffect-border-width': `${borderWidth}px`,
      }}
    />
  )
})

GlowingEffect.displayName = 'GlowingEffect'

export { GlowingEffect }
