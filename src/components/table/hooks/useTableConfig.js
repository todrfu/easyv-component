import { useMemo } from 'react'

/**
 * 解析布尔值
 * EasyV 可能传递字符串 "true"/"false" 而非布尔值
 */
export const parseBool = (val, defaultVal = false) => {
  if (typeof val === 'boolean') return val
  if (val === 'true') return true
  if (val === 'false') return false
  return defaultVal
}

/**
 * 解析颜色值
 * 支持新版颜色组件格式（纯色/渐变色）和旧版纯字符串格式
 * @param {string|Object} colorValue - 颜色值
 * @param {string} defaultColor - 默认颜色
 * @returns {string} CSS 颜色值
 */
export const parseColor = (colorValue, defaultColor = '#000000') => {
  // 空值返回默认色
  if (!colorValue) return defaultColor

  // 旧版格式：直接是颜色字符串
  if (typeof colorValue === 'string') return colorValue

  // 新版格式：对象 { type, pure, linear }
  if (typeof colorValue === 'object') {
    const { type, pure, linear } = colorValue

    // 纯色模式
    if (type === 'pure' && pure) {
      return pure
    }

    // 渐变色模式
    if (type === 'linear' && linear) {
      const { stops, angle = 0 } = linear
      if (Array.isArray(stops) && stops.length > 0) {
        const gradientStops = stops
          .map((stop) => {
            // offset 可能是 0-1 小数或 0-100 整数，需要判断
            const offset = stop.offset > 1 ? stop.offset : stop.offset * 100
            return `${stop.color} ${offset}%`
          })
          .join(', ')
        return `linear-gradient(${angle}deg, ${gradientStops})`
      }
    }

    // 如果对象格式不完整，尝试直接取 pure 或返回默认值
    if (pure) return pure
  }

  return defaultColor
}

/**
 * 表格配置解析 Hook
 * 从 EasyV 配置对象中提取并解析各项配置
 * @param {Object} configuration - EasyV 配置对象
 * @returns {Object} 解析后的配置值
 */
export function useTableConfig(configuration) {
  const config = configuration || {}
  // 提取嵌套配置组
  const tableStyle = config.tableStyle || {}
  const headerStyleConfig = config.headerStyle || {}
  const rowStyleConfig = config.rowStyle || {}
  const scrollConfigGroup = tableStyle.scrollConfig || {}
  const columnStyleConfig = config.columnStyle || {}
  const columnConfig = columnStyleConfig.columnConfig || {}
  const indexColumnConfig = columnStyleConfig.indexColumn || {}
  const advancedStyleConfig = config.advancedStyle || {}

  // 表格基础样式配置
  const tableSettings = useMemo(
    () => ({
      stripe: parseBool(tableStyle.stripe, false),
      border: parseBool(tableStyle.border, true),
      showHeader: parseBool(tableStyle.showHeader, true),
      highlightCurrentRow: parseBool(tableStyle.highlightCurrentRow, false),
      emptyText: tableStyle.emptyText || '暂无数据',
    }),
    [tableStyle.stripe, tableStyle.border, tableStyle.showHeader, tableStyle.highlightCurrentRow, tableStyle.emptyText]
  )

  // 序号列配置
  const indexColumn = useMemo(
    () => ({
      show: parseBool(indexColumnConfig.showIndex, false),
      label: indexColumnConfig.indexLabel || '序号',
      start: Number(indexColumnConfig.indexStart) || 1,
      width: Number(indexColumnConfig.indexWidth) || 60,
      align: indexColumnConfig.indexAlign || 'center',
      fixed: parseBool(indexColumnConfig.indexFixed, false),
    }),
    [indexColumnConfig]
  )

  // 表头样式配置
  const headerStyle = useMemo(() => {
    const textStyle = headerStyleConfig.headerTextStyle || {}

    return {
      height: Number(headerStyleConfig.headerHeight) || 40,
      bgColor: parseColor(headerStyleConfig.headerBgColor, '#1a1a2e'),
      fontFamily: textStyle.fontFamily || 'Microsoft Yahei',
      fontSize: Number(textStyle.fontSize) || 14,
      color: parseColor(textStyle.color, '#ffffff'),
      fontWeight: parseBool(textStyle.bold, false) ? 'bold' : textStyle.fontWeight || 'normal',
      fontStyle: parseBool(textStyle.italic, false) ? 'italic' : 'normal',
    }
  }, [headerStyleConfig])

  // 表体样式配置
  const bodyStyle = useMemo(() => {
    const textStyle = rowStyleConfig.bodyTextStyle || {}
    return {
      rowHeight: Number(rowStyleConfig.rowHeight) || 40,
      bgColor: parseColor(rowStyleConfig.bodyBgColor, '#16213e'),
      fontFamily: textStyle.fontFamily || 'Microsoft Yahei',
      fontSize: Number(textStyle.fontSize) || 13,
      color: parseColor(textStyle.color, '#e0e0e0'),
      fontWeight: parseBool(textStyle.bold, false) ? 'bold' : textStyle.fontWeight || 'normal',
      fontStyle: parseBool(textStyle.italic, false) ? 'italic' : 'normal',
      stripeBgColor: parseColor(rowStyleConfig.stripeBgColor, '#1a1a2e'),
      borderColor: parseColor(rowStyleConfig.borderColor, '#2a2a4a'),
      hoverBgColor: parseColor(rowStyleConfig.hoverBgColor, '#2a3f5f'),
      currentRowBgColor: parseColor(rowStyleConfig.currentRowBgColor, '#304d6d'),
    }
  }, [rowStyleConfig])

  // 滚动配置
  const scrollConfig = useMemo(
    () => ({
      autoScroll: parseBool(scrollConfigGroup.autoScroll, false),
      scrollSpeed: Number(scrollConfigGroup.scrollSpeed) || 50,
      scrollPauseOnHover: parseBool(scrollConfigGroup.scrollPauseOnHover, true),
    }),
    [scrollConfigGroup.autoScroll, scrollConfigGroup.scrollSpeed, scrollConfigGroup.scrollPauseOnHover]
  )

  // 列配置 - 从 JSON 字符串解析
  const columns = useMemo(() => {
    const columnsStr = columnConfig.columns
    if (!columnsStr) return []
    if (Array.isArray(columnsStr)) return columnsStr
    if (typeof columnsStr === 'string') {
      try {
        const parsed = JSON.parse(columnsStr)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        return []
      }
    }
    return []
  }, [columnConfig.columns])

  // 默认排序配置
  const defaultSort = config.defaultSort || null

  // 高级样式配置 - 解析样式和渲染脚本函数
  const advancedStyle = useMemo(() => {
    /**
     * 创建脚本函数
     * @param {string} script - 脚本字符串
     * @param {Array} params - 参数名列表
     * @returns {Function|null} 脚本函数
     */
    const createScriptFn = (script, params) => {
      if (!script || typeof script !== 'string' || script.trim() === '') {
        return null
      }
      try {
        return new Function(...params, script)
      } catch (e) {
        console.error('脚本解析错误:', e)
        return null
      }
    }

    // 提取嵌套分组配置
    const headerCellConfig = advancedStyleConfig.headerCell || {}
    const cellConfig = advancedStyleConfig.cell || {}
    const rowStyleConfig = advancedStyleConfig.rowStyle || {}

    return {
      // 表头单元格样式函数: (column, columnIndex) => styleObject
      headerCellStyleFn: createScriptFn(headerCellConfig.headerCellStyle, ['column', 'columnIndex']),
      // 表头单元格渲染函数: (column, columnIndex) => renderConfig
      headerCellRenderFn: createScriptFn(headerCellConfig.headerCellRender, ['column', 'columnIndex']),
      // 行样式函数: (row, rowIndex) => styleObject
      rowStyleFn: createScriptFn(rowStyleConfig.rowStyle, ['row', 'rowIndex']),
      // 单元格样式函数: (row, column, rowIndex, columnIndex) => styleObject
      cellStyleFn: createScriptFn(cellConfig.cellStyle, ['row', 'column', 'rowIndex', 'columnIndex']),
      // 单元格渲染函数: (row, column, rowIndex, columnIndex, value) => renderConfig
      cellRenderFn: createScriptFn(cellConfig.cellRender, ['row', 'column', 'rowIndex', 'columnIndex', 'value']),
    }
  }, [advancedStyleConfig])

  return {
    tableSettings,
    headerStyle,
    bodyStyle,
    scrollConfig,
    columns,
    indexColumn,
    defaultSort,
    advancedStyle,
  }
}

export default useTableConfig
