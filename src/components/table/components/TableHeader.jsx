import React, { forwardRef, useMemo } from 'react'
import css from '../styles/index.module.css'
import { isLastFixedLeft, isFirstFixedRight, convertToHeaderRows, flattenColumns, getHeaderRowCount } from '../utils'
import { MaterialSymbolsArrowDropUp, MaterialSymbolsArrowDropDownRounded } from './Icon'
import { CellContentRenderer } from './RenderElement'

/**
 * 表格列组件
 * 定义表格列宽度，供表头和表体共用以保持对齐
 * 只渲染叶子节点列
 */
function ColGroup({ leafColumns, colWidths }) {
  return (
    <colgroup>
      {leafColumns.map((col, i) => (
        <col
          key={col.prop || i}
          style={{
            width: colWidths[i] ? `${colWidths[i]}px` : 'auto',
            minWidth: col.minWidth ? `${col.minWidth}px` : undefined,
          }}
        />
      ))}
    </colgroup>
  )
}

/**
 * 排序图标组件
 */
function SortIcon({ column, sortState }) {
  if (!column.sortable) return null

  const isActive = sortState.prop === column.prop
  const isAsc = isActive && sortState.order === 'ascending'
  const isDesc = isActive && sortState.order === 'descending'

  return (
    <span className={css.sortWrapper}>
      <MaterialSymbolsArrowDropUp className={`${css.sortIcon} ${css.ascending} ${isAsc ? css.active : ''}`} />
      <MaterialSymbolsArrowDropDownRounded
        className={`${css.sortIcon} ${css.descending} ${isDesc ? css.active : ''}`}
      />
    </span>
  )
}

/**
 * 表头内容渲染
 * 支持富文本（HTML 标签如 <br />）
 */
function HeaderContent({ column }) {
  // 自定义渲染函数
  if (column.renderHeader) {
    return column.renderHeader({ column })
  }

  // 所有列都允许空标题
  const label = column.label !== undefined ? column.label : ''

  // 支持 HTML 标签（如 <br />, <br>, <span> 等）
  if (typeof label === 'string' && /<[^>]+>/.test(label)) {
    return <span className={css.headerMultiline} dangerouslySetInnerHTML={{ __html: label }} />
  }

  // 支持 \n 换行（向后兼容）
  if (typeof label === 'string' && (label.includes('\\n') || label.includes('\n'))) {
    const lines = label.split(/\\n|\n/)
    return (
      <span className={css.headerMultiline}>
        {lines.map((line, i) => (
          <React.Fragment key={i}>
            {line}
            {i < lines.length - 1 && <br />}
          </React.Fragment>
        ))}
      </span>
    )
  }

  return label
}

/**
 * 表头单元格组件
 */
function HeaderCell({ column, rowHeight, sortState, onSort, leafColumns, fixedInfo, leafStartIndex, headerCellStyleFn, headerCellRenderFn, columnIndex, leafColumnIndex }) {
  // 计算该单元格对应的叶子列索引范围（用于固定列样式）
  const getLeafColumnIndex = () => {
    if (column.isLeaf) {
      // 叶子节点，找到在 leafColumns 中的索引
      return leafColumns.findIndex((lc) => lc.prop === column.prop)
    }
    return leafStartIndex
  }

  const colIndex = getLeafColumnIndex()

  // 判断是否需要添加阴影边界样式（仅叶子节点）
  const isLastLeft = column.isLeaf && isLastFixedLeft(leafColumns, colIndex)
  const isFirstRight = column.isLeaf && isFirstFixedRight(leafColumns, colIndex)
  const isFixedLeft = column.fixed === 'left' || column.fixed === true
  const isFixedRight = column.fixed === 'right'

  // 判断是否是最后一列（基于叶子列索引）
  const lastLeafIndex = colIndex + column.colSpan - 1
  const isLastColumn = lastLeafIndex === leafColumns.length - 1

  // 计算固定列的 CSS 变量样式
  const getFixedStyle = () => {
    const style = {}
    if (isFixedLeft && fixedInfo.leftPositions[colIndex] !== null) {
      style['--fixed-left'] = `${fixedInfo.leftPositions[colIndex]}px`
    } else if (isFixedRight && fixedInfo.rightPositions[colIndex] !== null) {
      style['--fixed-right'] = `${fixedInfo.rightPositions[colIndex]}px`
    }
    return style
  }

  const fixedStyle = isFixedLeft || isFixedRight ? getFixedStyle() : {}

  // 计算单元格高度
  const cellHeight = rowHeight * column.rowSpan

  // 计算自定义样式
  const getCustomStyle = () => {
    if (!headerCellStyleFn) return {}
    try {
      const result = headerCellStyleFn(column, columnIndex, leafColumnIndex)
      return result && typeof result === 'object' ? result : {}
    } catch (e) {
      console.error('表头单元格样式脚本执行错误:', e)
      return {}
    }
  }

  // 计算自定义渲染配置
  const getRenderConfig = () => {
    if (!headerCellRenderFn) return null
    try {
      const result = headerCellRenderFn(column, columnIndex, leafColumnIndex)
      return result && typeof result === 'object' ? result : null
    } catch (e) {
      console.error('表头单元格渲染脚本执行错误:', e)
      return null
    }
  }

  const customCellStyle = getCustomStyle()
  const renderConfig = getRenderConfig()
  const hasRenderConfig = renderConfig !== null

  return (
    <th
      className={`${css.headerCell} ${column.sortable ? css.sortable : ''} ${isLastLeft ? css.fixedLeftLast : ''} ${
        isFirstRight ? css.fixedRightFirst : ''
      } ${isFixedLeft ? css.headerFixedLeft : ''} ${isFixedRight ? css.headerFixedRight : ''} ${
        isLastColumn ? css.lastColumn : ''
      } ${hasRenderConfig ? css.cellWithRender : ''}`}
      style={{
        textAlign: column.headerAlign || column.align || 'center',
        height: `${cellHeight}px`,
        ...fixedStyle,
        ...customCellStyle,
      }}
      colSpan={column.colSpan > 1 ? column.colSpan : undefined}
      rowSpan={column.rowSpan > 1 ? column.rowSpan : undefined}
      onClick={() => column.isLeaf && column.sortable && onSort(column)}
    >
      <div className={css.cellContent}>
        <CellContentRenderer renderConfig={renderConfig}>
          <HeaderContent column={column} />
        </CellContentRenderer>
        {column.isLeaf && <SortIcon column={column} sortState={sortState} />}
      </div>
    </th>
  )
}

/**
 * 表头组件
 * 支持横向滚动同步、列固定和多级表头
 */
const TableHeader = forwardRef(function TableHeader(
  { columns, colWidths, headerHeight, sortState, onSort, minWidth, fixedInfo, headerStyleFn, headerCellStyleFn, headerCellRenderFn, globalBorder, headerBorder },
  ref
) {
  // 计算叶子列（用于 colgroup）
  const leafColumns = useMemo(() => flattenColumns(columns), [columns])

  // 转换为多行表头结构
  const headerRows = useMemo(() => convertToHeaderRows(columns), [columns])

  // 计算表头行数
  const rowCount = useMemo(() => getHeaderRowCount(columns), [columns])

  // 计算每行的高度
  const rowHeight = headerHeight / rowCount

  // 决定使用哪个边框配置
  const effectiveBorder = useMemo(() => {
    if (headerBorder && headerBorder.enabled) {
      return headerBorder
    }
    return globalBorder
  }, [headerBorder, globalBorder])

  // 生成边框相关的 CSS 变量
  const borderVars = useMemo(() => {
    if (!effectiveBorder || !effectiveBorder.showBorder) {
      return {}
    }
    return {
      '--header-border-color': effectiveBorder.borderColor,
      '--header-border-width': `${effectiveBorder.borderWidth}px`,
    }
  }, [effectiveBorder])

  // 生成边框方向 className
  const borderDirectionClass = useMemo(() => {
    // 如果没有有效的边框配置或边框已关闭，返回 noBorder
    if (!effectiveBorder || effectiveBorder.showBorder === false) {
      return css.headerNoBorder
    }
    const direction = effectiveBorder.borderDirection || 'all'
    const capitalizedDirection = direction.charAt(0).toUpperCase() + direction.slice(1)
    return css[`headerBorder${capitalizedDirection}`] || ''
  }, [effectiveBorder])

  // 计算表头整体自定义样式
  const getHeaderCustomStyle = () => {
    if (!headerStyleFn) return {}
    try {
      const result = headerStyleFn()
      return result && typeof result === 'object' ? result : {}
    } catch (e) {
      console.error('表头整体样式脚本执行错误:', e)
      return {}
    }
  }

  const headerCustomStyle = getHeaderCustomStyle()

  return (
    <div
      ref={ref}
      className={`${css.tableHeader} ${borderDirectionClass}`}
      style={{ ...headerCustomStyle, ...borderVars }}
    >
      <table className={css.table} style={{ minWidth }}>
        <ColGroup leafColumns={leafColumns} colWidths={colWidths} />
        <thead>
          {headerRows.map((row, rowIndex) => (
            <tr key={rowIndex} className={css.headerRow}>
              {row.map((column, cellIndex) => (
                <HeaderCell
                  key={column.prop || `${rowIndex}-${cellIndex}`}
                  column={column}
                  rowHeight={rowHeight}
                  sortState={sortState}
                  onSort={onSort}
                  leafColumns={leafColumns}
                  fixedInfo={fixedInfo}
                  leafStartIndex={column.leafColumnIndex}
                  headerCellStyleFn={headerCellStyleFn}
                  headerCellRenderFn={headerCellRenderFn}
                  columnIndex={cellIndex}
                  leafColumnIndex={column.leafColumnIndex}
                />
              ))}
            </tr>
          ))}
        </thead>
      </table>
    </div>
  )
})

export default TableHeader
