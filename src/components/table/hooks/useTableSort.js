import { useState, useMemo, useCallback } from 'react'

/**
 * 表格排序 Hook
 * 处理列排序逻辑，支持自定义排序脚本
 * @param {Array} data - 表格数据
 * @param {Array} columns - 列配置
 * @param {Object} defaultSort - 默认排序配置 { prop, order }
 * @returns {Object} 排序状态和方法
 */
export function useTableSort(data, columns, defaultSort) {
  // 排序状态
  const [sortState, setSortState] = useState(() => {
    if (defaultSort) {
      return { prop: defaultSort.prop, order: defaultSort.order || 'ascending' }
    }
    return { prop: null, order: null }
  })

  // 排序后的数据
  const sortedData = useMemo(() => {
    if (!sortState.prop || !sortState.order) {
      return data
    }

    const column = columns.find((col) => col.prop === sortState.prop)
    if (!column) return data

    // 获取自定义排序脚本
    const customSortScript = column.sortScript

    return [...data].sort((a, b) => {
      let result

      // 使用自定义排序脚本（如果提供）
      if (customSortScript && typeof customSortScript === 'string') {
        try {
          // 从脚本创建函数: function(a, b, prop, order) { ...script... }
          // 用户脚本应返回: 负数 (a < b), 0 (a == b), 正数 (a > b)
          const sortFn = new Function('a', 'b', 'prop', 'order', customSortScript)
          result = sortFn(a, b, sortState.prop, sortState.order)
          // 如果脚本返回有效数字，直接使用（脚本自行处理排序方向）
          if (typeof result === 'number') {
            return result
          }
        } catch (e) {
          console.error('自定义排序脚本错误:', e)
          // 回退到默认排序
        }
      }

      // 默认排序逻辑
      const valA = a[sortState.prop]
      const valB = b[sortState.prop]

      if (valA === valB) {
        result = 0
      } else if (valA === null || valA === undefined) {
        result = 1
      } else if (valB === null || valB === undefined) {
        result = -1
      } else if (typeof valA === 'number' && typeof valB === 'number') {
        result = valA - valB
      } else {
        result = String(valA).localeCompare(String(valB), 'zh-CN')
      }

      return sortState.order === 'ascending' ? result : -result
    })
  }, [data, sortState, columns])

  // 处理排序点击
  const handleSort = useCallback(
    (column) => {
      if (!column.sortable) return

      const sortOrders = column.sortOrders || ['ascending', 'descending', null]
      let currentIndex = sortOrders.indexOf(sortState.order)

      if (sortState.prop !== column.prop) {
        currentIndex = -1
      }

      const nextIndex = (currentIndex + 1) % sortOrders.length
      const nextOrder = sortOrders[nextIndex]

      setSortState({
        prop: nextOrder ? column.prop : null,
        order: nextOrder,
        column: nextOrder ? column : null, // 保存列对象，用于树形排序获取排序脚本
      })
    },
    [sortState]
  )

  // 重置排序
  const resetSort = useCallback(() => {
    setSortState({ prop: null, order: null })
  }, [])

  return {
    sortState,
    sortedData,
    handleSort,
    resetSort,
  }
}

export default useTableSort
