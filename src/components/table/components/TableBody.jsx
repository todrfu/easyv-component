import React, { useState, forwardRef } from 'react'
import css from '../styles/index.module.css'
import { formatCellValue, isLastFixedLeft, isFirstFixedRight } from '../utils'
import { CellContentRenderer } from './RenderElement'
import ExpandRow from './ExpandRow'

/**
 * 表格列组件
 * 定义表格列宽度
 */
function ColGroup({ columns, colWidths }) {
  return (
    <colgroup>
      {columns.map((col, i) => (
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
 * 单元格组件
 */
function TableCell({ row, column, rowIndex, colIndex, rowHeight, onCellClick, isFixed, columns }) {
  const cellValue = formatCellValue(row, column, rowIndex)

  const handleClick = () => {
    // 不阻止冒泡，让行点击事件也能触发
    if (onCellClick) {
      onCellClick(row, column, rowIndex, colIndex, row[column.prop])
    }
  }

  // 判断是否需要添加阴影边界样式
  const isLastLeft = isLastFixedLeft(columns, colIndex)
  const isFirstRight = isFirstFixedRight(columns, colIndex)

  return (
    <td
      className={`${css.bodyCell} ${column.showOverflowTooltip ? css.ellipsis : ''} ${
        isLastLeft ? css.fixedLeftLast : ''
      } ${isFirstRight ? css.fixedRightFirst : ''} ${isFixed ? css.fixedCell : ''}`}
      style={{
        textAlign: column.align || 'center',
        height: `${rowHeight}px`,
        cursor: 'pointer',
      }}
      title={column.showOverflowTooltip ? cellValue : undefined}
      onClick={handleClick}
    >
      <div className={css.cellContent}>
        {column.render ? column.render({ row, column, $index: rowIndex }) : cellValue}
      </div>
    </td>
  )
}

/**
 * 表格行组件
 */
function TableRow({
  row,
  rowIndex,
  columns,
  rowHeight,
  stripe,
  highlightCurrentRow,
  hoveredRow,
  currentRow,
  onHover,
  onRowClick,
  onCellClick,
  fixedInfo,
  indexStart,
  rowStyleFn,
  cellStyleFn,
  cellRenderFn,
  expandConfig,
  isExpanded,
  onToggleExpand,
}) {
  const isStriped = stripe && rowIndex % 2 === 1
  const isHovered = hoveredRow === rowIndex
  const isCurrent = currentRow === rowIndex

  const handleRowClick = () => {
    if (onRowClick) {
      onRowClick(row, rowIndex)
    }
  }

  // 计算固定列的 CSS 变量样式（left/right 位置）
  const getFixedStyle = (column, colIndex) => {
    const style = {}
    if (column.fixed === 'left' || column.fixed === true) {
      style['--fixed-left'] = `${fixedInfo.leftPositions[colIndex]}px`
    } else if (column.fixed === 'right') {
      style['--fixed-right'] = `${fixedInfo.rightPositions[colIndex]}px`
    }
    return style
  }

  // 获取单元格显示值
  const getCellValue = (column, rowIdx) => {
    // 序号列特殊处理
    if (column.isIndexColumn) {
      return indexStart + rowIdx
    }
    return formatCellValue(row, column, rowIdx)
  }

  // 计算行自定义样式
  const getRowCustomStyle = () => {
    if (!rowStyleFn) return {}
    try {
      const result = rowStyleFn(row, rowIndex)
      return result && typeof result === 'object' ? result : {}
    } catch (e) {
      console.error('行样式脚本执行错误:', e)
      return {}
    }
  }

  // 计算单元格自定义样式
  const getCellCustomStyle = (column, colIndex) => {
    if (!cellStyleFn) return {}
    try {
      // colIndex 在表体中既是行内索引也是叶子列索引（因为表体使用扁平化列）
      const result = cellStyleFn(row, column, rowIndex, colIndex, colIndex)
      return result && typeof result === 'object' ? result : {}
    } catch (e) {
      console.error('单元格样式脚本执行错误:', e)
      return {}
    }
  }

  // 计算单元格自定义渲染配置
  const getCellRenderConfig = (column, colIndex, value) => {
    if (!cellRenderFn) return null
    try {
      // colIndex 在表体中既是行内索引也是叶子列索引（因为表体使用扁平化列）
      const result = cellRenderFn(row, column, rowIndex, colIndex, colIndex, value)
      return result && typeof result === 'object' ? result : null
    } catch (e) {
      console.error('单元格渲染脚本执行错误:', e)
      return null
    }
  }

  const rowCustomStyle = getRowCustomStyle()

  return (
    <tr
      className={`${css.bodyRow} ${isStriped ? css.striped : ''} ${isHovered ? css.hovered : ''} ${
        highlightCurrentRow && isCurrent ? css.currentRow : ''
      }`}
      onMouseEnter={() => onHover(rowIndex)}
      onMouseLeave={() => onHover(null)}
      onClick={handleRowClick}
      style={{ cursor: 'pointer', ...rowCustomStyle }}
    >
      {columns.map((column, colIndex) => {
        const isFixed = column.fixed === 'left' || column.fixed === true || column.fixed === 'right'
        const fixedStyle = isFixed ? getFixedStyle(column, colIndex) : {}
        const cellValue = getCellValue(column, rowIndex)
        const rawValue = column.isIndexColumn ? (indexStart + rowIndex) : row[column.prop]
        const cellCustomStyle = getCellCustomStyle(column, colIndex)
        const renderConfig = getCellRenderConfig(column, colIndex, rawValue)
        const hasRenderConfig = renderConfig !== null

        // 展开列特殊处理
        if (column.isExpandColumn) {
          return (
            <td
              key="__expand__"
              className={`${css.bodyCell} ${css.expandIconCell} ${
                isLastFixedLeft(columns, colIndex) ? css.fixedLeftLast : ''
              } ${isFirstFixedRight(columns, colIndex) ? css.fixedRightFirst : ''} ${
                column.fixed === 'left' || column.fixed === true ? css.fixedLeft : ''
              } ${column.fixed === 'right' ? css.fixedRight : ''}`}
              style={{
                textAlign: 'center',
                height: `${rowHeight}px`,
                cursor: 'pointer',
                ...fixedStyle,
              }}
              onClick={(e) => {
                e.stopPropagation()
                onToggleExpand(rowIndex)
              }}
            >
              <div
                className={css.expandIcon}
                dangerouslySetInnerHTML={{
                  __html: isExpanded ? expandConfig.collapseIcon : expandConfig.expandIcon,
                }}
              />
            </td>
          )
        }

        return (
          <td
            key={column.isIndexColumn ? '__index__' : column.prop || colIndex}
            className={`${css.bodyCell} ${column.showOverflowTooltip ? css.ellipsis : ''} ${
              isLastFixedLeft(columns, colIndex) ? css.fixedLeftLast : ''
            } ${isFirstFixedRight(columns, colIndex) ? css.fixedRightFirst : ''} ${
              column.fixed === 'left' || column.fixed === true ? css.fixedLeft : ''
            } ${column.fixed === 'right' ? css.fixedRight : ''} ${hasRenderConfig ? css.cellWithRender : ''}`}
            style={{
              textAlign: column.align || 'center',
              height: `${rowHeight}px`,
              cursor: 'pointer',
              ...fixedStyle,
              ...cellCustomStyle,
            }}
            title={column.showOverflowTooltip ? String(cellValue) : undefined}
            onClick={(e) => {
              // 展开列已经单独处理
              if (column.isExpandColumn) {
                return
              }
              // 如果展开图标在第一列模式，且当前是第一列，则触发展开
              if (expandConfig?.enabled && expandConfig.iconColumn === 'first' && colIndex === 0) {
                e.stopPropagation()
                onToggleExpand(rowIndex)
                return
              }
              // 序号列不触发单元格点击事件
              if (column.isIndexColumn) {
                return
              }
              if (onCellClick) {
                onCellClick(row, column, rowIndex, colIndex, row[column.prop])
              }
            }}
          >
            <div className={css.cellContent}>
              {/* 第一列模式：在表格的第一列显示展开图标 */}
              {expandConfig?.enabled && expandConfig.iconColumn === 'first' && colIndex === 0 && (
                <span
                  className={css.expandIconInline}
                  dangerouslySetInnerHTML={{
                    __html: isExpanded ? expandConfig.collapseIcon : expandConfig.expandIcon,
                  }}
                />
              )}
              <CellContentRenderer renderConfig={renderConfig}>
                {column.render ? column.render({ row, column, $index: rowIndex }) : cellValue}
              </CellContentRenderer>
            </div>
          </td>
        )
      })}
    </tr>
  )
}

/**
 * 表体组件
 * 支持纵向滚动和横向滚动，以及自定义事件和列固定
 */
const TableBody = forwardRef(function TableBody(
  {
    data,
    columns,
    colWidths,
    rowHeight,
    stripe,
    highlightCurrentRow,
    showHeader,
    headerHeight,
    minWidth,
    onScroll,
    onRowClick,
    onCellClick,
    fixedInfo,
    indexStart = 1,
    rowStyleFn,
    cellStyleFn,
    cellRenderFn,
    expandConfig,
    expandedRows,
    onToggleExpand,
  },
  ref
) {
  const [hoveredRow, setHoveredRow] = useState(null)
  const [currentRow, setCurrentRow] = useState(null)

  // 行点击处理：更新高亮状态 + 触发事件
  const handleRowClick = (row, rowIndex) => {
    if (highlightCurrentRow) {
      setCurrentRow(rowIndex)
    }
    if (onRowClick) {
      onRowClick(row, rowIndex)
    }
  }

  return (
    <div
      ref={ref}
      className={css.tableBody}
      style={{
        height: showHeader ? `calc(100% - ${headerHeight}px)` : '100%',
      }}
      onScroll={onScroll}
    >
      <table className={css.table} style={{ minWidth }}>
        <ColGroup columns={columns} colWidths={colWidths} />
        <tbody>
          {data.map((row, rowIndex) => {
            const isExpanded = expandedRows?.has(rowIndex) || false
            return (
              <React.Fragment key={row.id || rowIndex}>
                <TableRow
                  row={row}
                  rowIndex={rowIndex}
                  columns={columns}
                  colWidths={colWidths}
                  rowHeight={rowHeight}
                  stripe={stripe}
                  highlightCurrentRow={highlightCurrentRow}
                  hoveredRow={hoveredRow}
                  currentRow={currentRow}
                  onHover={setHoveredRow}
                  onRowClick={handleRowClick}
                  onCellClick={onCellClick}
                  fixedInfo={fixedInfo}
                  indexStart={indexStart}
                  rowStyleFn={rowStyleFn}
                  cellStyleFn={cellStyleFn}
                  cellRenderFn={cellRenderFn}
                  expandConfig={expandConfig}
                  isExpanded={isExpanded}
                  onToggleExpand={onToggleExpand}
                />
                {expandConfig?.enabled && isExpanded && (
                  <ExpandRow
                    row={row}
                    rowIndex={rowIndex}
                    colSpan={columns.length}
                    expandRenderFn={expandConfig.expandRenderFn}
                  />
                )}
              </React.Fragment>
            )
          })}
        </tbody>
      </table>
    </div>
  )
})

export default TableBody
