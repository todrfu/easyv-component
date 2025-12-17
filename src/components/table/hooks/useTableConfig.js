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
  const borderConfig = tableStyle.border || {}
  const headerBorderConfig = headerStyleConfig.border || {}
  const columnStyleConfig = config.columnStyle || {}
  const columnConfig = columnStyleConfig.columnConfig || {}
  const indexColumnConfig = columnStyleConfig.indexColumn || {}
  const advancedStyleConfig = config.advancedStyle || {}
  const expandConfigGroup = config.expandConfig || {}
  const treeConfigGroup = config.treeConfig || {}

  // 表格基础样式配置
  const tableSettings = useMemo(
    () => ({
      stripe: parseBool(tableStyle.stripe, false),
      showBorder: parseBool(borderConfig.show, true),
      borderColor: parseColor(borderConfig.borderColor, '#2a2a4a'),
      borderWidth: Number(borderConfig.borderWidth) || 1,
      borderDirection: borderConfig.borderDirection || 'horizontal',
      showHeader: parseBool(tableStyle.showHeader, true),
      highlightCurrentRow: parseBool(tableStyle.highlightCurrentRow, false),
      emptyText: tableStyle.emptyText || '暂无数据',
      borderRadius: Number(tableStyle.borderRadius) || 0,
      containerBgColor: parseColor(tableStyle.containerBgColor, '#041F42'),
    }),
    [tableStyle.stripe, borderConfig.show, borderConfig.borderColor, borderConfig.borderWidth, borderConfig.borderDirection, tableStyle.showHeader, tableStyle.highlightCurrentRow, tableStyle.emptyText, tableStyle.borderRadius, tableStyle.containerBgColor]
  )

  // 序号列配置
  const indexColumn = useMemo(
    () => ({
      show: parseBool(indexColumnConfig.show, true),
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
      // 表头边框配置
      border: {
        enabled: parseBool(headerBorderConfig.show, false), // 是否启用独立边框配置
        showBorder: true, // 启用独立配置时默认显示边框
        borderColor: parseColor(headerBorderConfig.borderColor, '#2a2a4a'),
        borderWidth: Number(headerBorderConfig.borderWidth) || 1,
        borderDirection: headerBorderConfig.borderDirection || 'all',
      },
    }
  }, [headerStyleConfig, headerBorderConfig])

  // 表体样式配置
  const bodyStyle = useMemo(() => {
    const textStyle = rowStyleConfig.bodyTextStyle || {}
    return {
      rowHeight: Number(rowStyleConfig.rowHeight) || 40,
      rowGap: Number(rowStyleConfig.rowGap) || 0,
      bgColor: parseColor(rowStyleConfig.bodyBgColor, '#16213e'),
      fontFamily: textStyle.fontFamily || 'Microsoft Yahei',
      fontSize: Number(textStyle.fontSize) || 13,
      color: parseColor(textStyle.color, '#e0e0e0'),
      fontWeight: parseBool(textStyle.bold, false) ? 'bold' : textStyle.fontWeight || 'normal',
      fontStyle: parseBool(textStyle.italic, false) ? 'italic' : 'normal',
      stripeBgColor: parseColor(rowStyleConfig.stripeBgColor, '#1a1a2e'),
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

  // 列配置脚本函数
  const columnScriptFn = useMemo(() => {
    const columnsScript = columnConfig.columns
    if (!columnsScript || typeof columnsScript !== 'string') {
      return null
    }
    try {
      // 用户只编写函数体，我们包装成完整函数
      return new Function('data', columnsScript)
    } catch (e) {
      console.error('列定义脚本解析错误:', e)
      return null
    }
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
    const headerConfig = advancedStyleConfig.header || {}
    const headerCellConfig = advancedStyleConfig.headerCell || {}
    const cellConfig = advancedStyleConfig.cell || {}
    const rowStyleConfig = advancedStyleConfig.rowStyle || {}

    return {
      // 表头整体样式函数: () => styleObject
      headerStyleFn: createScriptFn(headerConfig.headerStyle, []),
      // 表头单元格样式函数: (column, columnIndex, leafColumnIndex) => styleObject
      headerCellStyleFn: createScriptFn(headerCellConfig.headerCellStyle, ['column', 'columnIndex', 'leafColumnIndex']),
      // 表头单元格渲染函数: (column, columnIndex, leafColumnIndex) => renderConfig
      headerCellRenderFn: createScriptFn(headerCellConfig.headerCellRender, ['column', 'columnIndex', 'leafColumnIndex']),
      // 行样式函数: (row, rowIndex) => styleObject
      rowStyleFn: createScriptFn(rowStyleConfig.rowStyle, ['row', 'rowIndex']),
      // 单元格样式函数: (row, column, rowIndex, columnIndex, leafColumnIndex) => styleObject
      cellStyleFn: createScriptFn(cellConfig.cellStyle, ['row', 'column', 'rowIndex', 'columnIndex', 'leafColumnIndex']),
      // 单元格渲染函数: (row, column, rowIndex, columnIndex, leafColumnIndex, value) => renderConfig
      cellRenderFn: createScriptFn(cellConfig.cellRender, ['row', 'column', 'rowIndex', 'columnIndex', 'leafColumnIndex', 'value']),
    }
  }, [advancedStyleConfig])

  // 展开行配置
  const expandConfig = useMemo(() => {
    // 解析展开内容渲染脚本
    const renderScript = expandConfigGroup.expandRenderScript
    let expandRenderFn = null
    if (renderScript && typeof renderScript === 'string' && renderScript.trim() !== '') {
      try {
        expandRenderFn = new Function('row', 'rowIndex', renderScript)
      } catch (e) {
        console.error('展开内容渲染脚本解析错误:', e)
      }
    }

    return {
      enabled: parseBool(expandConfigGroup.enableExpand, false),
      iconColumn: expandConfigGroup.expandIconColumn || 'separate', // 'first' | 'separate'
      columnWidth: Number(expandConfigGroup.expandColumnWidth) || 48,
      columnLabel: expandConfigGroup.expandColumnLabel || '',
      accordion: parseBool(expandConfigGroup.accordion, false),
      defaultExpandAll: parseBool(expandConfigGroup.defaultExpandAll, false),
      expandIcon: expandConfigGroup.expandIcon || '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>',
      collapseIcon: expandConfigGroup.collapseIcon || '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6z"/></svg>',
      expandRenderFn,
    }
  }, [
    expandConfigGroup.enableExpand,
    expandConfigGroup.expandIconColumn,
    expandConfigGroup.expandColumnWidth,
    expandConfigGroup.expandColumnLabel,
    expandConfigGroup.accordion,
    expandConfigGroup.defaultExpandAll,
    expandConfigGroup.expandIcon,
    expandConfigGroup.collapseIcon,
    expandConfigGroup.expandRenderScript,
  ])

  // 树形表格配置
  const treeConfig = useMemo(() => {
    // 解析懒加载脚本
    const lazyScript = treeConfigGroup.lazyLoadScript
    let lazyLoadFn = null
    if (lazyScript && typeof lazyScript === 'string' && lazyScript.trim() !== '') {
      try {
        lazyLoadFn = new Function('row', 'resolve', lazyScript)
      } catch (e) {
        console.error('树形懒加载脚本解析错误:', e)
      }
    }

    return {
      enabled: parseBool(treeConfigGroup.enableTree, false),
      childrenField: treeConfigGroup.childrenField || 'children',
      treeColumn: treeConfigGroup.treeColumn || 'name',
      indent: Number(treeConfigGroup.indent) || 20,
      defaultExpandAll: parseBool(treeConfigGroup.defaultExpandAll, false),
      defaultExpandLevel: Number(treeConfigGroup.defaultExpandLevel) ?? 1,
      treeExpandIcon: treeConfigGroup.treeExpandIcon || '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M8.59 16.58L13.17 12 8.59 7.41 10 6l6 6-6 6z"/></svg>',
      treeCollapseIcon: treeConfigGroup.treeCollapseIcon || '<svg viewBox="0 0 24 24" width="16" height="16"><path fill="currentColor" d="M7.41 8.58L12 13.17l4.59-4.59L18 10l-6 6-6-6z"/></svg>',
      lazy: parseBool(treeConfigGroup.lazy, false),
      lazyLoadFn,
    }
  }, [
    treeConfigGroup.enableTree,
    treeConfigGroup.childrenField,
    treeConfigGroup.treeColumn,
    treeConfigGroup.indent,
    treeConfigGroup.defaultExpandAll,
    treeConfigGroup.defaultExpandLevel,
    treeConfigGroup.treeExpandIcon,
    treeConfigGroup.treeCollapseIcon,
    treeConfigGroup.lazy,
    treeConfigGroup.lazyLoadScript,
  ])

  return {
    tableSettings,
    headerStyle,
    bodyStyle,
    scrollConfig,
    columnScriptFn,
    indexColumn,
    defaultSort,
    advancedStyle,
    expandConfig,
    treeConfig,
  }
}

export default useTableConfig
