import { useState, useCallback, useEffect, useMemo } from 'react'

/**
 * 展开行状态管理 Hook
 * @param {Object} expandConfig - 展开行配置
 * @param {Array} data - 表格数据
 * @returns {Object} 展开行状态和操作方法
 */
export function useExpandRow(expandConfig, data) {
  const { enabled, accordion, defaultExpandAll } = expandConfig

  // 存储展开行的索引集合
  const [expandedRows, setExpandedRows] = useState(() => {
    if (!enabled || !defaultExpandAll || !data) return new Set()
    // 默认全部展开：将所有行索引添加到 Set 中
    return new Set(data.map((_, index) => index))
  })

  // 当 defaultExpandAll 或 data 变化时，重新初始化展开状态
  useEffect(() => {
    if (!enabled) {
      setExpandedRows(new Set())
      return
    }
    if (defaultExpandAll && data) {
      setExpandedRows(new Set(data.map((_, index) => index)))
    } else {
      setExpandedRows(new Set())
    }
  }, [enabled, defaultExpandAll, data])

  /**
   * 切换行展开状态
   * @param {number} rowIndex - 行索引
   */
  const toggleRowExpand = useCallback(
    (rowIndex) => {
      if (!enabled) return

      setExpandedRows((prev) => {
        const newSet = new Set(prev)

        if (accordion) {
          // 手风琴模式：关闭所有其他行，只保留当前行
          if (newSet.has(rowIndex)) {
            // 如果当前行已展开，则收起
            newSet.clear()
          } else {
            // 否则收起所有行，展开当前行
            newSet.clear()
            newSet.add(rowIndex)
          }
        } else {
          // 普通模式：切换当前行状态
          if (newSet.has(rowIndex)) {
            newSet.delete(rowIndex)
          } else {
            newSet.add(rowIndex)
          }
        }

        return newSet
      })
    },
    [enabled, accordion]
  )

  /**
   * 判断指定行是否展开
   * @param {number} rowIndex - 行索引
   * @returns {boolean}
   */
  const isRowExpanded = useCallback(
    (rowIndex) => {
      return enabled && expandedRows.has(rowIndex)
    },
    [enabled, expandedRows]
  )

  /**
   * 展开所有行
   */
  const expandAll = useCallback(() => {
    if (!enabled || !data) return
    setExpandedRows(new Set(data.map((_, index) => index)))
  }, [enabled, data])

  /**
   * 收起所有行
   */
  const collapseAll = useCallback(() => {
    if (!enabled) return
    setExpandedRows(new Set())
  }, [enabled])

  return {
    expandedRows,
    toggleRowExpand,
    isRowExpanded,
    expandAll,
    collapseAll,
  }
}

export default useExpandRow
