import React, { useMemo } from 'react'
import css from '../styles/index.module.css'

/**
 * 展开行内容组件
 * @param {Object} props
 * @param {Object} props.row - 当前行数据
 * @param {number} props.rowIndex - 行索引
 * @param {number} props.colSpan - 列跨度
 * @param {Function} props.expandRenderFn - 展开内容渲染函数
 */
export function ExpandRow({ row, rowIndex, colSpan, expandRenderFn }) {
  // 执行渲染函数获取 HTML 字符串
  const htmlContent = useMemo(() => {
    if (!expandRenderFn) {
      return '<div style="padding: 20px; color: #999;">未配置展开内容渲染函数</div>'
    }

    try {
      const result = expandRenderFn(row, rowIndex)
      if (typeof result === 'string') {
        return result
      }
      return '<div style="padding: 20px; color: #999;">渲染函数返回值必须是 HTML 字符串</div>'
    } catch (error) {
      console.error('展开内容渲染错误:', error)
      return '<div style="padding: 20px; color: #f56c6c;">渲染出错，请检查渲染函数</div>'
    }
  }, [row, rowIndex, expandRenderFn])

  return (
    <tr className={css.expandRow}>
      <td colSpan={colSpan} className={css.expandCell}>
        <div
          className={css.expandContent}
          dangerouslySetInnerHTML={{ __html: htmlContent }}
        />
      </td>
    </tr>
  )
}

export default ExpandRow
