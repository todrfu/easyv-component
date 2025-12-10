import { useCallback } from 'react'

/**
 * 表格事件 Hook
 * 处理表格的自定义事件，通过 EasyV emit 接口触发
 * @param {Function} emit - EasyV 提供的事件触发函数
 * @param {Array} data - 表格数据
 * @returns {Object} 事件处理函数
 */
export function useTableEvents(emit, data) {
  /**
   * 触发行点击事件
   * @param {Object} row - 行数据
   * @param {number} rowIndex - 行索引
   */
  const emitRowClick = useCallback(
    (row, rowIndex) => {
      if (typeof emit === 'function') {
        emit('rowClick', {
          row,
          rowIndex,
          data,
        })
      }
    },
    [emit, data]
  )

  /**
   * 触发单元格点击事件
   * @param {Object} row - 行数据
   * @param {Object} column - 列配置
   * @param {number} rowIndex - 行索引
   * @param {number} colIndex - 列索引
   * @param {*} value - 单元格值
   */
  const emitCellClick = useCallback(
    (row, column, rowIndex, colIndex, value) => {
      if (typeof emit === 'function') {
        emit('cellClick', {
          row,
          column: {
            prop: column.prop,
            label: column.label,
          },
          rowIndex,
          colIndex,
          value,
          data,
        })
      }
    },
    [emit, data]
  )

  return {
    emitRowClick,
    emitCellClick,
  }
}

export default useTableEvents
