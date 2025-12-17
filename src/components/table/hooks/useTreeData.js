import { useState, useMemo, useCallback, useEffect, useRef } from 'react'

/**
 * 树形数据层级内排序
 * @param {Array} treeData - 树形数据
 * @param {string} childrenField - 子节点字段名
 * @param {string} sortProp - 排序字段
 * @param {string} sortOrder - 排序方向 (ascending/descending)
 * @param {Function} sortScript - 自定义排序函数
 * @returns {Array} 排序后的树形数据
 */
function sortTreeData(treeData, childrenField, sortProp, sortOrder, sortScript) {
  if (!Array.isArray(treeData) || !sortProp || !sortOrder) {
    return treeData
  }

  // 深拷贝数据，避免修改原始数据
  const sortedData = treeData.map((node) => {
    const newNode = { ...node }
    // 如果有子节点，递归排序
    if (newNode[childrenField] && Array.isArray(newNode[childrenField]) && newNode[childrenField].length > 0) {
      newNode[childrenField] = sortTreeData(newNode[childrenField], childrenField, sortProp, sortOrder, sortScript)
    }
    return newNode
  })

  // 排序当前层级
  sortedData.sort((a, b) => {
    if (sortScript) {
      try {
        // 使用自定义排序脚本
        return sortScript(a, b, sortOrder)
      } catch (e) {
        console.error('树形排序脚本执行错误:', e)
        return 0
      }
    }

    // 默认排序逻辑
    const aVal = a[sortProp]
    const bVal = b[sortProp]

    if (aVal === bVal) return 0

    const compareResult = aVal > bVal ? 1 : -1
    return sortOrder === 'ascending' ? compareResult : -compareResult
  })

  return sortedData
}

/**
 * 树形数据管理 Hook
 * 处理树形表格的数据扁平化、展开/收起状态、懒加载等功能
 * @param {Object} treeConfig - 树形配置
 * @param {Array} data - 原始数据
 * @param {Object} sortState - 排序状态 { prop, order }
 * @returns {Object} 树形数据相关状态和方法
 */
export function useTreeData(treeConfig, data, sortState) {
  const { enabled, childrenField, defaultExpandAll, defaultExpandLevel, lazy, lazyLoadFn } = treeConfig

  // 展开的节点 ID 集合
  const [expandedKeys, setExpandedKeys] = useState(new Set())
  // 懒加载的子节点数据 Map: nodeId -> children
  const [lazyLoadedData, setLazyLoadedData] = useState(new Map())
  // 正在加载的节点 ID 集合
  const [loadingKeys, setLoadingKeys] = useState(new Set())

  /**
   * 扁平化树形数据
   * @param {Array} treeData - 树形数据
   * @param {number} level - 当前层级
   * @param {any} parentId - 父节点ID
   * @returns {Array} 扁平化后的数据列表
   */
  const flattenTreeData = useCallback(
    (treeData, level = 0, parentId = null) => {
      if (!Array.isArray(treeData)) return []

      const result = []

      for (let i = 0; i < treeData.length; i++) {
        const node = treeData[i]
        const nodeId = node.id || `${parentId}-${i}`

        // 添加当前节点（带有树形元数据）
        result.push({
          ...node,
          __treeNodeId__: nodeId,
          __treeLevel__: level,
          __treeParentId__: parentId,
          __treeHasChildren__: lazy
            ? node.hasChildren !== false // 懒加载模式：hasChildren 字段或默认 true
            : Boolean(node[childrenField] && node[childrenField].length > 0), // 普通模式：检查子节点
          __treeIsLeaf__: lazy
            ? node.hasChildren === false
            : !node[childrenField] || node[childrenField].length === 0,
          __treeIsExpanded__: expandedKeys.has(nodeId),
          __treeIsLoading__: loadingKeys.has(nodeId),
        })

        // 如果节点已展开，递归处理子节点
        if (expandedKeys.has(nodeId)) {
          let children = null

          // 懒加载模式：从 lazyLoadedData 获取
          if (lazy) {
            children = lazyLoadedData.get(nodeId)
          } else {
            // 普通模式：从节点的 children 字段获取
            children = node[childrenField]
          }

          if (children && Array.isArray(children) && children.length > 0) {
            const childNodes = flattenTreeData(children, level + 1, nodeId)
            result.push(...childNodes)
          }
        }
      }

      return result
    },
    [childrenField, expandedKeys, lazy, lazyLoadedData, loadingKeys]
  )

  /**
   * 初始化默认展开的节点
   * 使用 ref 来避免在排序等操作时重复初始化
   */
  const initializedRef = useRef(false)

  useEffect(() => {
    // 只在首次启用或数据从空变为有值时初始化
    if (!enabled || !data || data.length === 0) {
      setExpandedKeys(new Set())
      initializedRef.current = false
      return
    }

    // 如果已经初始化过，不再重复初始化（避免排序时重置展开状态）
    if (initializedRef.current) {
      return
    }

    initializedRef.current = true

    // 全部展开
    if (defaultExpandAll) {
      const allKeys = new Set()
      const collectKeys = (nodes, level = 0) => {
        if (!Array.isArray(nodes)) return
        nodes.forEach((node) => {
          const nodeId = node.id
          if (nodeId && node[childrenField] && node[childrenField].length > 0) {
            allKeys.add(nodeId)
            collectKeys(node[childrenField], level + 1)
          }
        })
      }
      collectKeys(data)
      setExpandedKeys(allKeys)
      return
    }

    // 按层级展开
    if (defaultExpandLevel > 0) {
      const keysToExpand = new Set()
      const collectKeys = (nodes, level = 0) => {
        if (!Array.isArray(nodes)) return
        if (level >= defaultExpandLevel) return
        nodes.forEach((node) => {
          const nodeId = node.id
          if (nodeId && node[childrenField] && node[childrenField].length > 0) {
            keysToExpand.add(nodeId)
            collectKeys(node[childrenField], level + 1)
          }
        })
      }
      collectKeys(data)
      setExpandedKeys(keysToExpand)
      return
    }

    // defaultExpandLevel === 0 或其他情况，全部收起
    setExpandedKeys(new Set())
  }, [enabled, data, childrenField, defaultExpandAll, defaultExpandLevel])

  /**
   * 切换节点展开/收起
   * @param {any} nodeId - 节点ID
   * @param {Object} node - 节点数据
   */
  const toggleNodeExpand = useCallback(
    (nodeId, node) => {
      if (!enabled) return

      setExpandedKeys((prev) => {
        const newSet = new Set(prev)
        if (newSet.has(nodeId)) {
          // 收起节点
          newSet.delete(nodeId)
        } else {
          // 展开节点
          newSet.add(nodeId)

          // 如果是懒加载模式且尚未加载子节点
          if (lazy && !lazyLoadedData.has(nodeId) && node.__treeHasChildren__) {
            // 标记为加载中
            setLoadingKeys((prev) => new Set(prev).add(nodeId))

            // 调用懒加载函数
            if (lazyLoadFn) {
              try {
                const resolve = (children) => {
                  // 保存加载的子节点数据
                  setLazyLoadedData((prev) => {
                    const newMap = new Map(prev)
                    newMap.set(nodeId, children || [])
                    return newMap
                  })
                  // 移除加载中状态
                  setLoadingKeys((prev) => {
                    const newSet = new Set(prev)
                    newSet.delete(nodeId)
                    return newSet
                  })
                }
                lazyLoadFn(node, resolve)
              } catch (error) {
                console.error('树形懒加载错误:', error)
                // 移除加载中状态
                setLoadingKeys((prev) => {
                  const newSet = new Set(prev)
                  newSet.delete(nodeId)
                  return newSet
                })
              }
            }
          }
        }
        return newSet
      })
    },
    [enabled, lazy, lazyLoadFn, lazyLoadedData]
  )

  /**
   * 展开所有节点
   */
  const expandAll = useCallback(() => {
    if (!enabled || !data) return
    const allKeys = new Set()
    const collectKeys = (nodes) => {
      if (!Array.isArray(nodes)) return
      nodes.forEach((node) => {
        const nodeId = node.id
        if (nodeId && node[childrenField] && node[childrenField].length > 0) {
          allKeys.add(nodeId)
          collectKeys(node[childrenField])
        }
      })
    }
    collectKeys(data)
    setExpandedKeys(allKeys)
  }, [enabled, data, childrenField])

  /**
   * 收起所有节点
   */
  const collapseAll = useCallback(() => {
    if (!enabled) return
    setExpandedKeys(new Set())
  }, [enabled])

  // 扁平化后的表格数据（应用排序）
  const flatData = useMemo(() => {
    if (!enabled || !data) return data || []

    // 先进行树形层级内排序
    let sortedTreeData = data
    if (sortState && sortState.prop && sortState.order) {
      // 查找对应列的排序脚本
      const column = sortState.column
      const sortScript = column?.sortScript
        ? (() => {
            try {
              // sortScript 是字符串，需要解析成函数
              return new Function('a', 'b', 'order', sortScript)
            } catch (e) {
              console.error('排序脚本解析错误:', e)
              return null
            }
          })()
        : null

      sortedTreeData = sortTreeData(data, childrenField, sortState.prop, sortState.order, sortScript)
    }

    // 扁平化排序后的树形数据
    return flattenTreeData(sortedTreeData, 0, null)
  }, [enabled, data, sortState, childrenField, flattenTreeData])

  return {
    // 状态
    expandedKeys,
    loadingKeys,
    flatData, // 扁平化后的数据（用于表格渲染）

    // 方法
    toggleNodeExpand,
    expandAll,
    collapseAll,
  }
}

export default useTreeData
