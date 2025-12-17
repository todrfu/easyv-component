import React from 'react'
import css from '../styles/index.module.css'

/**
 * 图片元素
 * @param {Object} props - 配置
 * @param {string} props.src - 图片地址（支持 URL、Base64、SVG data URI）
 * @param {number} props.width - 宽度
 * @param {number} props.height - 高度
 * @param {Object} props.style - 自定义样式
 */
function ImageElement({ src, width, height, style = {} }) {
  if (!src) return null

  return (
    <img
      src={src}
      alt=""
      style={{
        width: width ? `${width}px` : 'auto',
        height: height ? `${height}px` : 'auto',
        objectFit: 'contain',
        verticalAlign: 'middle',
        ...style,
      }}
    />
  )
}

/**
 * 文本元素
 * @param {Object} props - 配置
 * @param {string} props.content - 文本内容
 * @param {Object} props.style - 自定义样式
 */
function TextElement({ content, style = {} }) {
  if (!content) return null
  return <span style={{ display: 'contents', ...style }}>{content}</span>
}

/**
 * HTML 元素（支持内嵌 SVG）
 * @param {Object} props - 配置
 * @param {string} props.content - HTML/SVG 内容
 * @param {Object} props.style - 自定义样式
 */
function HtmlElement({ content, style = {} }) {
  if (!content) return null
  return <span style={{ display: 'contents', ...style }} dangerouslySetInnerHTML={{ __html: content }} />
}

/**
 * 渲染元素工厂
 * 根据配置类型渲染对应的元素
 * @param {Object} config - 元素配置
 * @returns {React.ReactNode}
 *
 * 支持的元素类型：
 * - image: 图片 { type: 'image', src, width?, height?, style? }
 * - text: 文本 { type: 'text', content, style? }
 * - html: HTML/SVG { type: 'html', content, style? }
 */
export function renderElement(config) {
  if (!config || typeof config !== 'object') return null

  const { type, ...props } = config

  switch (type) {
    case 'image':
      return <ImageElement {...props} />
    case 'text':
      return <TextElement {...props} />
    case 'html':
      return <HtmlElement {...props} />
    default:
      return null
  }
}

/**
 * 位置装饰元素容器
 * 用于在单元格角落放置装饰元素
 * @param {Object} props - 配置
 * @param {Object} props.element - 元素配置
 * @param {string} props.position - 位置 topLeft|topRight|bottomLeft|bottomRight
 */
export function PositionedElement({ element, position }) {
  if (!element) return null

  const positionStyles = {
    topLeft: { position: 'absolute', top: 0, left: 0 },
    topRight: { position: 'absolute', top: 0, right: 0 },
    bottomLeft: { position: 'absolute', bottom: 0, left: 0 },
    bottomRight: { position: 'absolute', bottom: 0, right: 0 },
  }

  const style = positionStyles[position] || positionStyles.topLeft

  return (
    <span className={css.positionedElement} style={style}>
      {renderElement(element)}
    </span>
  )
}

/**
 * 单元格内容渲染器
 * 处理 prefix/suffix/content 渲染逻辑
 * @param {Object} props - 配置
 * @param {Object} props.renderConfig - 渲染配置
 * @param {React.ReactNode} props.children - 原始内容
 */
export function CellContentRenderer({ renderConfig, children }) {
  if (!renderConfig || typeof renderConfig !== 'object') {
    return children
  }

  const { prefix, suffix, content, hideText } = renderConfig

  // 处理位置装饰元素（角落定位）
  const positionedElements = []
  if (prefix?.position && prefix.position !== 'inline') {
    positionedElements.push(
      <PositionedElement key="prefix-pos" element={prefix} position={prefix.position} />
    )
  }
  if (suffix?.position && suffix.position !== 'inline') {
    positionedElements.push(
      <PositionedElement key="suffix-pos" element={suffix} position={suffix.position} />
    )
  }

  // 处理行内元素
  const inlinePrefix = prefix && (!prefix.position || prefix.position === 'inline')
    ? renderElement(prefix)
    : null
  const inlineSuffix = suffix && (!suffix.position || suffix.position === 'inline')
    ? renderElement(suffix)
    : null

  // 处理内容替换
  const mainContent = content
    ? renderElement(content)
    : (hideText ? null : children)

  return (
    <>
      {positionedElements}
      {inlinePrefix}
      {mainContent}
      {inlineSuffix}
    </>
  )
}

export default {
  renderElement,
  PositionedElement,
  CellContentRenderer,
}
