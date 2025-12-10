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
  const bodyStyleConfig = config.bodyStyle || {}
  const scrollConfigGroup = config.scrollConfig || {}
  const columnConfig = config.columnConfig || {}
  const indexColumnConfig = config.indexColumn || {}

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
      bgColor: headerStyleConfig.headerBgColor || '#1a1a2e',
      fontFamily: textStyle.fontFamily || 'Microsoft Yahei',
      fontSize: Number(textStyle.fontSize) || 14,
      color: textStyle.color || '#ffffff',
      fontWeight: parseBool(textStyle.bold, false) ? 'bold' : textStyle.fontWeight || 'normal',
      fontStyle: parseBool(textStyle.italic, false) ? 'italic' : 'normal',
    }
  }, [headerStyleConfig])

  // 表体样式配置
  const bodyStyle = useMemo(() => {
    const textStyle = bodyStyleConfig.bodyTextStyle || {}
    return {
      rowHeight: Number(bodyStyleConfig.rowHeight) || 40,
      bgColor: bodyStyleConfig.bodyBgColor || '#16213e',
      fontFamily: textStyle.fontFamily || 'Microsoft Yahei',
      fontSize: Number(textStyle.fontSize) || 13,
      color: textStyle.color || '#e0e0e0',
      fontWeight: parseBool(textStyle.bold, false) ? 'bold' : textStyle.fontWeight || 'normal',
      fontStyle: parseBool(textStyle.italic, false) ? 'italic' : 'normal',
      stripeBgColor: bodyStyleConfig.stripeBgColor || '#1a1a2e',
      borderColor: bodyStyleConfig.borderColor || '#2a2a4a',
      hoverBgColor: bodyStyleConfig.hoverBgColor || '#2a3f5f',
      currentRowBgColor: bodyStyleConfig.currentRowBgColor || '#304d6d',
    }
  }, [bodyStyleConfig])

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

  return {
    tableSettings,
    headerStyle,
    bodyStyle,
    scrollConfig,
    columns,
    indexColumn,
    defaultSort,
  }
}

export default useTableConfig
