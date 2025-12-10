import { useEffect, useRef } from 'react'

/**
 * 自动滚动 Hook
 * 实现表格内容自动滚动功能
 * @param {Object} options - 滚动配置
 * @param {boolean} options.enabled - 是否启用自动滚动
 * @param {number} options.speed - 滚动速度(ms)
 * @param {boolean} options.pauseOnHover - 鼠标悬停时暂停
 * @param {Array} deps - 依赖数组，用于重新初始化滚动
 * @returns {Object} ref - 需要绑定到滚动容器的 ref
 */
export function useAutoScroll(options, deps = []) {
  const { enabled, speed, pauseOnHover } = options
  const containerRef = useRef(null)
  const animationRef = useRef(null)

  useEffect(() => {
    if (!enabled || !containerRef.current) return

    const container = containerRef.current
    const contentHeight = container.scrollHeight
    const viewHeight = container.clientHeight

    // 内容未超出视口，无需滚动
    if (contentHeight <= viewHeight) return

    let isPaused = false
    let currentScroll = 0

    const scroll = () => {
      if (isPaused) {
        animationRef.current = requestAnimationFrame(scroll)
        return
      }

      currentScroll += 1
      if (currentScroll >= contentHeight - viewHeight) {
        currentScroll = 0
      }
      container.scrollTop = currentScroll

      animationRef.current = setTimeout(() => {
        requestAnimationFrame(scroll)
      }, speed)
    }

    const handleMouseEnter = () => {
      if (pauseOnHover) isPaused = true
    }

    const handleMouseLeave = () => {
      isPaused = false
    }

    container.addEventListener('mouseenter', handleMouseEnter)
    container.addEventListener('mouseleave', handleMouseLeave)
    animationRef.current = requestAnimationFrame(scroll)

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
        clearTimeout(animationRef.current)
      }
      container.removeEventListener('mouseenter', handleMouseEnter)
      container.removeEventListener('mouseleave', handleMouseLeave)
    }
  }, [enabled, speed, pauseOnHover, ...deps])

  return containerRef
}

export default useAutoScroll
