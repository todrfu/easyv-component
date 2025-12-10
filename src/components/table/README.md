# Table 表格组件

功能丰富的数据表格组件，支持多级表头、列固定、排序、自动滚动等特性。

## 功能特性

- ✅ 多级表头（通过 `children` 嵌套定义）
- ✅ 列固定（支持左侧/右侧固定）
- ✅ 列排序（支持自定义排序脚本）
- ✅ 序号列（可配置起始值、对齐方式、固定）
- ✅ 斑马纹
- ✅ 行高亮（hover、点击高亮）
- ✅ 自动滚动
- ✅ 横向滚动
- ✅ 自定义事件（行点击、单元格点击）
- ✅ 空数据提示

## 目录结构

```
table/
├── assets/
│   └── logo.png              # 组件图标
├── components/
│   ├── EmptyState.jsx        # 空数据状态组件
│   ├── Icon.jsx              # 图标组件
│   ├── TableBody.jsx         # 表体组件
│   ├── TableHeader.jsx       # 表头组件
│   └── index.js              # 组件导出
├── config/
│   ├── main.json             # 组件配置
│   └── main.data.json        # 示例数据
├── hooks/
│   ├── useAutoScroll.js      # 自动滚动 Hook
│   ├── useTableConfig.js     # 配置解析 Hook
│   ├── useTableEvents.js     # 事件处理 Hook
│   ├── useTableSort.js       # 排序逻辑 Hook
│   └── index.js              # Hooks 导出
├── styles/
│   └── index.module.css      # 样式文件
├── utils/
│   ├── index.js              # 工具函数
│   ├── bind-children.js      # 子组件绑定
│   └── reduce-config.js      # 配置处理
├── index.jsx                 # 组件入口
└── README.md                 # 组件文档
```

## 配置说明

### 全局配置 (tableStyle)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| stripe | boolean | false | 斑马纹 |
| border | boolean | true | 显示边框 |
| showHeader | boolean | true | 显示表头 |
| highlightCurrentRow | boolean | false | 点击高亮当前行 |
| emptyText | string | "暂无数据" | 空数据提示文本 |

### 序号列配置 (indexColumn)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| showIndex | boolean | false | 显示序号列 |
| indexLabel | string | "序号" | 序号列标题 |
| indexStart | number | 1 | 起始值 |
| indexWidth | number | 60 | 列宽 |
| indexAlign | string | "center" | 对齐方式 (left/center/right) |
| indexFixed | boolean | false | 固定到左侧 |

### 表头配置 (headerStyle)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| headerHeight | number | 40 | 表头高度 |
| headerBgColor | color | #1a1a2e | 背景色 |
| headerTextStyle | textStyle | - | 文字样式 |

### 行配置 (bodyStyle)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| rowHeight | number | 40 | 行高 |
| bodyBgColor | color | #16213e | 背景色 |
| bodyTextStyle | textStyle | - | 文字样式 |
| stripeBgColor | color | #1a1a2e | 斑马纹背景色 |
| hoverBgColor | color | #2a3f5f | 悬停背景色 |
| currentRowBgColor | color | #304d6d | 高亮行背景色 |
| borderColor | color | #2a2a4a | 边框颜色 |

### 列配置 (columnConfig)

列定义使用 JSON 数组格式：

```json
[
  {
    "prop": "id",
    "label": "ID",
    "width": 60,
    "align": "center",
    "fixed": "left",
    "sortable": true
  },
  {
    "label": "地址信息",
    "children": [
      { "prop": "province", "label": "省份", "width": 100 },
      { "prop": "city", "label": "城市", "width": 100 }
    ]
  }
]
```

#### 列属性说明

| 属性 | 类型 | 说明 |
|------|------|------|
| prop | string | 字段名（对应数据中的 key） |
| label | string | 显示名称（支持 HTML，如 `<br/>` 换行） |
| width | number | 列宽（像素） |
| minWidth | number | 最小列宽 |
| align | string | 内容对齐方式 (left/center/right) |
| headerAlign | string | 表头对齐方式 |
| fixed | string/boolean | 固定列 (left/right/true) |
| sortable | boolean | 是否可排序 |
| sortScript | string | 自定义排序脚本 |
| children | array | 子列（用于多级表头） |
| showOverflowTooltip | boolean | 内容溢出时显示 tooltip |

### 滚动配置 (scrollConfig)

| 配置项 | 类型 | 默认值 | 说明 |
|--------|------|--------|------|
| autoScroll | boolean | false | 自动滚动 |
| scrollSpeed | number | 50 | 滚动速度（ms） |
| scrollPauseOnHover | boolean | true | 悬停暂停 |

## 触发器事件

| 事件名 | 说明 | 回调参数 |
|--------|------|----------|
| rowClick | 点击行 | `{ row, rowIndex, data }` |
| cellClick | 点击单元格 | `{ row, column, rowIndex, colIndex, value, data }` |

## 使用示例

### 基础表格

```json
{
  "columns": [
    { "prop": "id", "label": "ID", "width": 60 },
    { "prop": "name", "label": "姓名", "width": 100 },
    { "prop": "age", "label": "年龄", "width": 80 }
  ]
}
```

### 多级表头

```json
{
  "columns": [
    { "prop": "id", "label": "ID", "width": 60 },
    {
      "label": "个人信息",
      "children": [
        { "prop": "name", "label": "姓名", "width": 100 },
        { "prop": "age", "label": "年龄", "width": 80 }
      ]
    }
  ]
}
```

### 固定列

```json
{
  "columns": [
    { "prop": "id", "label": "ID", "width": 60, "fixed": "left" },
    { "prop": "name", "label": "姓名", "width": 100 },
    { "prop": "status", "label": "状态", "width": 80, "fixed": "right" }
  ]
}
```

### 自定义排序

```json
{
  "columns": [
    {
      "prop": "amount",
      "label": "金额",
      "sortable": true,
      "sortScript": "var result = a.amount - b.amount; return order === 'ascending' ? result : -result;"
    }
  ]
}
```

## 数据格式

```json
{
  "data": [
    { "id": 1, "name": "张三", "age": 28 },
    { "id": 2, "name": "李四", "age": 32 }
  ],
  "fields": {
    "id": { "type": "number" },
    "name": { "type": "string" },
    "age": { "type": "number" }
  }
}
```
