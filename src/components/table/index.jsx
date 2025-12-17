import React, { useMemo, useRef, useCallback } from 'react'
import css from './styles/index.module.css'

// Hooks
import { useTableConfig, useTableSort, useAutoScroll, useTableEvents, useExpandRow } from './hooks'

// Components
import { TableHeader, TableBody, EmptyState } from './components'

// Utils
import {
  calculateColumnWidths,
  generateCSSVariables,
  generateColumnsFromData,
  calculateFixedPositions,
  flattenColumns,
} from './utils'

/**
 * EasyV 自定义表格组件
 * 支持 el-table 兼容配置，包括：
 * - 列自定义（label, prop, width, minWidth, fixed, align, headerAlign）
 * - 多级表头（通过 children 嵌套定义）
 * - 排序（sortable, sortScript 自定义排序脚本）
 * - 表头自定义（支持富文本如 <br/> 换行）
 * - 行样式（stripe 斑马纹, border 边框, highlightCurrentRow 高亮）
 * - 自动滚动
 * - 横向滚动（列宽超出时）
 * - 固定列（fixed: "left" | "right" | true）
 * - 自定义事件（点击行、点击单元格）
 */
export default function Table(props = {}) {
  const {
    left = 0,
    top = 0,
    width = 600,
    height = 300,
    id,
    data,
    configuration,
    emit, // EasyV 提供的事件触发函数
  } = props

  // Refs 用于同步横向滚动
  const headerRef = useRef(null)

  // 解析配置
  const {
    tableSettings,
    headerStyle,
    bodyStyle,
    scrollConfig,
    columnScriptFn,
    indexColumn,
    defaultSort,
    advancedStyle,
    expandConfig,
  } = useTableConfig(configuration)

  // 解析表格数据
  const tableData = useMemo(() => {
    if (!data) return []
    if (Array.isArray(data)) return data
    return []
  }, [data])

  // 通过脚本生成列配置
  const configColumns = useMemo(() => {
    if (!columnScriptFn) {
      // 如果没有脚本函数，返回空数组，后续会从数据自动生成
      return []
    }
    try {
      const result = columnScriptFn(tableData)
      return Array.isArray(result) ? result : []
    } catch (e) {
      console.error('列定义脚本执行错误:', e)
      return []
    }
  }, [columnScriptFn, tableData])

  // 生成序号列配置（仅在 show 为 true 时生成）
  const indexColumnConfig = useMemo(() => {
    if (!indexColumn || !indexColumn.show) return null
    return {
      prop: '__index__',
      label: indexColumn.label || '序号',
      width: indexColumn.width || 60,
      align: indexColumn.align || 'center',
      fixed: indexColumn.fixed ? 'left' : undefined,
      isIndexColumn: true,
      sortable: false, // 序号列不可排序
    }
  }, [indexColumn])

  // 生成展开列配置（仅在启用且为 separate 模式时生成）
  const expandColumnConfig = useMemo(() => {
    if (!expandConfig?.enabled || expandConfig.iconColumn !== 'separate') return null
    return {
      prop: '__expand__',
      label: expandConfig.columnLabel || '',
      width: expandConfig.columnWidth || 48,
      align: 'center',
      fixed: 'left',
      isExpandColumn: true,
      sortable: false,
    }
  }, [expandConfig])

  // 生成有效列配置（配置优先，否则从数据自动生成）
  // 保留原始嵌套结构用于表头渲染
  const effectiveColumns = useMemo(() => {
    let cols = configColumns.length > 0 ? configColumns : generateColumnsFromData(tableData)

    // 按正确顺序插入特殊列
    const specialCols = []

    // 1. 展开列（separate 模式）应该在最左侧
    if (expandColumnConfig) {
      specialCols.push(expandColumnConfig)
    }

    // 2. 序号列在展开列之后
    if (indexColumnConfig) {
      specialCols.push(indexColumnConfig)
    }

    // 3. 数据列在最后
    cols = [...specialCols, ...cols]

    return cols
  }, [configColumns, tableData, expandColumnConfig, indexColumnConfig])

  // 扁平化列配置（用于表体渲染和列宽计算）
  const leafColumns = useMemo(() => flattenColumns(effectiveColumns), [effectiveColumns])

  // 排序逻辑（使用扁平化后的叶子列）
  const { sortState, sortedData, handleSort } = useTableSort(tableData, leafColumns, defaultSort)

  // 展开行状态管理
  const { expandedRows, toggleRowExpand } = useExpandRow(expandConfig, sortedData)

  // 自定义事件处理
  const { emitRowClick, emitCellClick, emitSortChange } = useTableEvents(emit, tableData)

  // 包装排序处理函数，同时触发事件
  const handleSortWithEvent = useCallback(
    (column) => {
      handleSort(column)
      // 计算新的排序状态
      const sortOrders = column.sortOrders || ['ascending', 'descending', null]
      let currentIndex = sortOrders.indexOf(sortState.order)
      if (sortState.prop !== column.prop) {
        currentIndex = -1
      }
      const nextIndex = (currentIndex + 1) % sortOrders.length
      const nextOrder = sortOrders[nextIndex]
      // 触发排序变化事件
      emitSortChange(
        {
          prop: nextOrder ? column.prop : null,
          order: nextOrder,
        },
        column
      )
    },
    [handleSort, sortState, emitSortChange]
  )

  // 自动滚动（纵向）
  const autoScrollRef = useAutoScroll(
    {
      enabled: scrollConfig.autoScroll,
      speed: scrollConfig.scrollSpeed,
      pauseOnHover: scrollConfig.scrollPauseOnHover,
    },
    [sortedData]
  )

  // 同步横向滚动：表体滚动时同步表头
  const handleBodyScroll = useCallback((e) => {
    if (headerRef.current) {
      headerRef.current.scrollLeft = e.target.scrollLeft
    }
  }, [])

  // 计算列宽度（基于叶子列）
  const colWidths = useMemo(() => calculateColumnWidths(leafColumns), [leafColumns])

  // 计算表格最小宽度（所有列宽之和）
  const tableMinWidth = useMemo(() => {
    const totalWidth = colWidths.reduce((sum, w) => sum + (w || 100), 0)
    return totalWidth > 0 ? totalWidth : undefined
  }, [colWidths])

  // 计算固定列位置信息（基于叶子列）
  const fixedInfo = useMemo(() => calculateFixedPositions(leafColumns, colWidths), [leafColumns, colWidths])

  // 容器样式
  const containerStyles = {
    position: 'absolute',
    left,
    top,
    width,
    height,
    overflow: 'hidden',
    fontFamily: 'Arial, sans-serif',
  }

  // CSS 变量
  const cssVars = {
    ...generateCSSVariables(headerStyle, bodyStyle),
    '--border-radius': `${tableSettings.borderRadius}px`,
    '--container-bg': tableSettings.containerBgColor,
    '--border-color': tableSettings.borderColor,
    '--border-width': `${tableSettings.borderWidth}px`,
  }

  return (
    <div className="__easyv-component" style={containerStyles} id={id}>
      <div
        className={`${css.tableWrapper} ${!tableSettings.showBorder ? css.noBorder : css.bordered} ${tableSettings.showBorder ? css[`border${tableSettings.borderDirection.charAt(0).toUpperCase() + tableSettings.borderDirection.slice(1)}`] || '' : ''}`}
        style={cssVars}
      >
        {/* 表头 - 使用原始嵌套列配置 */}
        {tableSettings.showHeader && (
          <TableHeader
            ref={headerRef}
            columns={effectiveColumns}
            colWidths={colWidths}
            headerHeight={headerStyle.height}
            sortState={sortState}
            onSort={handleSortWithEvent}
            minWidth={tableMinWidth}
            fixedInfo={fixedInfo}
            headerStyleFn={advancedStyle.headerStyleFn}
            headerCellStyleFn={advancedStyle.headerCellStyleFn}
            headerCellRenderFn={advancedStyle.headerCellRenderFn}
            globalBorder={{
              showBorder: tableSettings.showBorder,
              borderColor: tableSettings.borderColor,
              borderWidth: tableSettings.borderWidth,
              borderDirection: tableSettings.borderDirection,
            }}
            headerBorder={headerStyle.border}
          />
        )}

        {/* 表体 - 使用扁平化的叶子列 */}
        {sortedData.length === 0 ? (
          <EmptyState
            text={tableSettings.emptyText}
            showHeader={tableSettings.showHeader}
            headerHeight={headerStyle.height}
          />
        ) : (
          <TableBody
            ref={autoScrollRef}
            data={sortedData}
            columns={leafColumns}
            colWidths={colWidths}
            rowHeight={bodyStyle.rowHeight}
            stripe={tableSettings.stripe}
            highlightCurrentRow={tableSettings.highlightCurrentRow}
            showHeader={tableSettings.showHeader}
            headerHeight={headerStyle.height}
            minWidth={tableMinWidth}
            onScroll={handleBodyScroll}
            onRowClick={emitRowClick}
            onCellClick={emitCellClick}
            fixedInfo={fixedInfo}
            indexStart={indexColumn.start}
            rowStyleFn={advancedStyle.rowStyleFn}
            cellStyleFn={advancedStyle.cellStyleFn}
            cellRenderFn={advancedStyle.cellRenderFn}
            expandConfig={expandConfig}
            expandedRows={expandedRows}
            onToggleExpand={toggleRowExpand}
          />
        )}
      </div>
    </div>
  )
}
