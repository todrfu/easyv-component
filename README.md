# EasyV 自定义组件库

EasyV 数据可视化平台自定义组件开发项目。

## 环境要求

- Node >= 14

## 快速开始

```bash
# 安装依赖
npm install

# 启动开发环境
npm start
```

## 项目结构

```
easyv-components/
├── src/
│   └── components/          # 组件目录
│       └── table/           # 表格组件
│           ├── assets/      # 静态资源
│           ├── components/  # 子组件
│           ├── config/      # 配置文件
│           ├── hooks/       # React Hooks
│           ├── styles/      # 样式文件
│           ├── utils/       # 工具函数
│           ├── index.jsx    # 组件入口
│           └── README.md    # 组件文档
├── package.json
└── README.md
```

## 组件列表

| 组件 | 描述 | 文档 |
|------|------|------|
| table | 自定义表格组件 | [查看](src/components/table/README.md) |

## 开发规范

### 组件目录结构

每个组件应包含以下文件：

```
component-name/
├── assets/           # 静态资源（图片、图标等）
├── components/       # 子组件
├── config/
│   ├── main.json     # 组件配置
│   └── main.data.json # 示例数据
├── hooks/            # 自定义 Hooks
├── styles/           # 样式文件
├── utils/            # 工具函数
├── index.jsx         # 组件入口
└── README.md         # 组件文档
```

### 配置文件说明

- `main.json`: 定义组件的配置项，包括基础信息、配置面板、触发器等
- `main.data.json`: 定义组件的示例数据和字段类型

[组件开发文档](https://easyv.cloud/help/docs/ln5eiyoxxmlzklam.html)
