/**
 * 格式化单元格值
 * @param {Object} row - 行数据
 * @param {Object} column - 列配置
 * @param {number} index - 行索引
 * @returns {string} 格式化后的值
 */
export function formatCellValue(row, column, index) {
  const value = row[column.prop];

  // 使用自定义格式化函数
  if (column.formatter) {
    return column.formatter(row, column, value, index);
  }

  if (value === null || value === undefined) {
    return "";
  }

  return String(value);
}

/**
 * 计算列宽度数组
 * @param {Array} columns - 列配置数组
 * @returns {Array} 列宽度数组
 */
export function calculateColumnWidths(columns) {
  if (!columns || columns.length === 0) return [];

  return columns.map((col) => {
    if (col.width) {
      return typeof col.width === "number" ? col.width : parseInt(col.width) || 0;
    }
    if (col.minWidth) {
      return typeof col.minWidth === "number" ? col.minWidth : parseInt(col.minWidth) || 0;
    }
    return 0; // 自动宽度
  });
}

/**
 * 生成 CSS 变量对象
 * @param {Object} headerStyle - 表头样式配置
 * @param {Object} bodyStyle - 表体样式配置
 * @returns {Object} CSS 变量对象
 */
export function generateCSSVariables(headerStyle, bodyStyle) {
  return {
    "--header-bg": headerStyle.bgColor,
    "--header-color": headerStyle.color,
    "--header-font-family": headerStyle.fontFamily,
    "--header-font-size": `${headerStyle.fontSize}px`,
    "--header-font-weight": headerStyle.fontWeight,
    "--header-font-style": headerStyle.fontStyle,
    "--header-height": `${headerStyle.height}px`,
    "--body-bg": bodyStyle.bgColor,
    "--body-color": bodyStyle.color,
    "--body-font-family": bodyStyle.fontFamily,
    "--body-font-size": `${bodyStyle.fontSize}px`,
    "--body-font-weight": bodyStyle.fontWeight,
    "--body-font-style": bodyStyle.fontStyle,
    "--row-height": `${bodyStyle.rowHeight}px`,
    "--stripe-bg": bodyStyle.stripeBgColor,
    "--border-color": bodyStyle.borderColor,
    "--hover-bg": bodyStyle.hoverBgColor,
    "--current-row-bg": bodyStyle.currentRowBgColor,
  };
}

/**
 * 根据数据自动生成列配置
 * @param {Array} data - 表格数据
 * @returns {Array} 列配置数组
 */
export function generateColumnsFromData(data) {
  if (!data || data.length === 0 || !data[0] || typeof data[0] !== "object") {
    return [];
  }

  return Object.keys(data[0]).map((key) => ({
    prop: key,
    label: key,
    sortable: false,
  }));
}

/**
 * 计算固定列的位置信息
 * @param {Array} columns - 列配置数组
 * @param {Array} colWidths - 列宽度数组
 * @returns {Object} 固定列位置信息 { leftPositions, rightPositions, hasFixedLeft, hasFixedRight }
 */
export function calculateFixedPositions(columns, colWidths) {
  if (!columns || columns.length === 0) {
    return {
      leftPositions: [],
      rightPositions: [],
      hasFixedLeft: false,
      hasFixedRight: false,
    };
  }

  const leftPositions = [];
  const rightPositions = [];
  let hasFixedLeft = false;
  let hasFixedRight = false;

  // 计算左侧固定列的 left 值
  let leftOffset = 0;
  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];
    const width = colWidths[i] || 100; // 默认宽度 100px

    if (col.fixed === "left" || col.fixed === true) {
      leftPositions[i] = leftOffset;
      leftOffset += width;
      hasFixedLeft = true;
    } else {
      leftPositions[i] = null;
    }
  }

  // 计算右侧固定列的 right 值（从右向左累加）
  let rightOffset = 0;
  for (let i = columns.length - 1; i >= 0; i--) {
    const col = columns[i];
    const width = colWidths[i] || 100;

    if (col.fixed === "right") {
      rightPositions[i] = rightOffset;
      rightOffset += width;
      hasFixedRight = true;
    } else {
      rightPositions[i] = null;
    }
  }

  return {
    leftPositions,
    rightPositions,
    hasFixedLeft,
    hasFixedRight,
  };
}

/**
 * 判断列是否是最后一个左侧固定列
 * @param {Array} columns - 列配置数组
 * @param {number} colIndex - 当前列索引
 * @returns {boolean}
 */
export function isLastFixedLeft(columns, colIndex) {
  const col = columns[colIndex];
  if (col.fixed !== "left" && col.fixed !== true) return false;

  // 检查后续列是否还有左侧固定列
  for (let i = colIndex + 1; i < columns.length; i++) {
    if (columns[i].fixed === "left" || columns[i].fixed === true) {
      return false;
    }
  }
  return true;
}

/**
 * 判断列是否是第一个右侧固定列
 * @param {Array} columns - 列配置数组
 * @param {number} colIndex - 当前列索引
 * @returns {boolean}
 */
export function isFirstFixedRight(columns, colIndex) {
  const col = columns[colIndex];
  if (col.fixed !== "right") return false;

  // 检查前面的列是否还有右侧固定列
  for (let i = colIndex - 1; i >= 0; i--) {
    if (columns[i].fixed === "right") {
      return false;
    }
  }
  return true;
}

/**
 * 扁平化嵌套列配置，提取所有叶子节点列（用于表体渲染）
 * @param {Array} columns - 列配置数组（可能包含 children）
 * @returns {Array} 扁平化后的叶子列数组
 */
export function flattenColumns(columns) {
  const result = [];

  const flatten = (cols, parentFixed) => {
    cols.forEach((col) => {
      // 继承父级的 fixed 属性
      const fixed = col.fixed || parentFixed;

      if (col.children && col.children.length > 0) {
        // 有子列，递归处理
        flatten(col.children, fixed);
      } else {
        // 叶子节点，添加到结果中，并继承 fixed
        result.push({ ...col, fixed });
      }
    });
  };

  flatten(columns, undefined);
  return result;
}

/**
 * 计算列的最大深度（表头行数）
 * @param {Array} columns - 列配置数组
 * @returns {number} 最大深度
 */
export function getHeaderRowCount(columns) {
  let maxDepth = 1;

  const getDepth = (cols, depth) => {
    cols.forEach((col) => {
      if (col.children && col.children.length > 0) {
        getDepth(col.children, depth + 1);
      } else {
        maxDepth = Math.max(maxDepth, depth);
      }
    });
  };

  getDepth(columns, 1);
  return maxDepth;
}

/**
 * 计算列的 colspan（子列数量）
 * @param {Object} column - 列配置
 * @returns {number} colspan 值
 */
export function getColSpan(column) {
  if (!column.children || column.children.length === 0) {
    return 1;
  }

  let span = 0;
  column.children.forEach((child) => {
    span += getColSpan(child);
  });
  return span;
}

/**
 * 计算列的 rowspan（需要合并的行数）
 * @param {Object} column - 列配置
 * @param {number} currentDepth - 当前深度
 * @param {number} maxDepth - 最大深度
 * @returns {number} rowspan 值
 */
export function getRowSpan(column, currentDepth, maxDepth) {
  if (!column.children || column.children.length === 0) {
    // 叶子节点，需要跨越剩余行数
    return maxDepth - currentDepth + 1;
  }
  // 非叶子节点，不需要跨行
  return 1;
}

/**
 * 将嵌套列配置转换为多行表头结构
 * @param {Array} columns - 列配置数组
 * @returns {Array} 表头行数组，每行包含该行的单元格配置
 */
export function convertToHeaderRows(columns) {
  const maxDepth = getHeaderRowCount(columns);
  const rows = Array.from({ length: maxDepth }, () => []);

  const processColumns = (cols, depth, parentFixed) => {
    cols.forEach((col) => {
      const fixed = col.fixed || parentFixed;
      const colSpan = getColSpan(col);
      const rowSpan = getRowSpan(col, depth, maxDepth);

      // 创建表头单元格配置
      const headerCell = {
        ...col,
        fixed,
        colSpan,
        rowSpan,
        isLeaf: !col.children || col.children.length === 0,
      };

      rows[depth - 1].push(headerCell);

      // 递归处理子列
      if (col.children && col.children.length > 0) {
        processColumns(col.children, depth + 1, fixed);
      }
    });
  };

  processColumns(columns, 1, undefined);
  return rows;
}
