# @compass-aiden/helpers

> 实用程序库

[Web端使用文档](https://aiden-fe.github.io/compass-helpers/browser/)

[Node端使用文档](https://aiden-fe.github.io/compass-helpers/node/)

## Getting Started

### browser项目使用

npm方式安装:

`npm install @compass-aiden/helpers`

```typescript
// 按需导入,自动识别导入esm文件
import { formatDate } from '@compass-aiden/helpers';
// 全量导入
import * as allHelpers from '@compass-aiden/helpers';
// 通过别名路径导入esm文件
import { formatDate } from '@compass-aiden/helpers/esm';
```

浏览器script标签安装:

```html
<!-- 请根据个人需求采用unpkg或者jsdelivr链接 -->
<script src="https://unpkg.com/@compass-aiden/helpers@latest/dist/compass-helpers.umd.js"></script>
<script>
  console.log(window.CompassHelpers.formatDate());
</script>
```

### node项目使用

npm方式安装:

`npm install @compass-aiden/helpers`

```typescript
// 按需导入 自动导入cjs文件
const { createFile } = require('@compass-aiden/helpers');
// 全量导入
const helpers = require('@compass-aiden/helpers');

/** 在type: module启用ESM环境下,请参考如下方式 */
// 通过别名路径导入cjs文件,如果不能识别条件导出,tsconfig可设置 `{ "moduleResolution": "bundler" }`
import { createFile } from '@compass-aiden/helpers/cjs';
// 自动导入默认cjs文件, 当 tsconfig 配置包含 `{ "moduleResolution": "NodeNext" }`时可用
import { createFile } from '@compass-aiden/helpers';
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

### 添加一个新的工具函数

1. 请先确定该函数适用的平台 Browser/Node/Common
2. 通用函数请放入 `src/common-utils`
3. browser 平台函数放入 `src/browser-utils`
4. Node 平台函数放入 `src/node-utils`
5. 为函数添加一定的文档描述,如下示例

```typescript
// src/browser-utils/example.ts

/**
 * @category Tools
 */
export default function example() {
  console.log('可指定的category在 src/browser.ts 或 src/node.ts 文件顶部声明');
}
```

更多文档注解参考 [TypeDoc](https://typedoc.org/guides/overview/)

### Publish library

提交合并请求至master即可
