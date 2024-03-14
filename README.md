# @compass-aiden/helpers

> 实用程序库

[Web端使用文档](https://aiden-fe.github.io/compass-helpers/browser/)

[Node端使用文档](https://aiden-fe.github.io/compass-helpers/node/)

## Getting Started

### 安装

npm方式安装:

`npm install @compass-aiden/helpers`

浏览器script标签安装:

通过jsdelivr或者unpkg直接script标签导入`dist/compass-helpers.umd.js`文件后,window.CompassHelpers即可访问到

### 导入使用

#### web项目

```typescript
// 自动识别导入esm文件
import { formatDate } from '@compass-aiden/helpers';
// 全量导入
import * as allHelpers from '@compass-aiden/helpers';
// 通过别名路径导入esm文件
import { formatDate } from '@compass-aiden/helpers/esm';
// 导入umd文件
import '@compass-aiden/helpers/umd';
```

#### node项目

```typescript
// 自动识别导入cjs文件, 如果无法识别tsconfig 设置 { "module": "NodeNext", "moduleResolution": "NodeNext" }
import { createFile } from '@compass-aiden/helpers';
// 全量导入
import * as allHelpers from '@compass-aiden/helpers';
// 通过别名路径导入cjs文件
import { createFile } from '@compass-aiden/helpers/node';
// 自动导入cjs文件
const { createFile } = require('@compass-aiden/helpers');
```

## Contributes

### Install

`pnpm install`

### Base commands

- `pnpm dev` 启用开发模式
- `pnpm build` 生产构建
- `pnpm lint` 代码校验
- `pnpm format` 代码格式化
- `pnpm test` 执行单元测试
- `pnpm build:doc` 构建文档

### Publish library

1. 变更package.json内的version字段
2. 提交合并请求至master即可
