/**
 * @description 递归搜索树形数据
 * @param data 需要搜索的树形数据
 * @param handler 匹配方法
 * @param options 配置项
 * @param options.childrenKey 子节点的key,默认: children
 * @category Array
 */

// 定义树节点的基础类型
type TreeNode = Record<string, unknown>;

export function findTree<T extends TreeNode>(
  data: T | T[],
  handler: (nodeData: T) => boolean,
  options?: { childrenKey?: string },
): T | undefined {
  const { childrenKey = 'children' } = options || {};
  const treeData = Array.isArray(data) ? data : [data];

  for (const item of treeData) {
    // 首先检查当前节点是否匹配
    if (handler(item)) {
      return item;
    }

    // 检查是否有子节点需要递归搜索
    const children = item[childrenKey];
    if (Array.isArray(children) && children.length > 0) {
      // 递归搜索子节点
      const found = findTree(children as T[], handler, options);
      if (found) {
        return found;
      }
    }
  }

  return undefined;
}

// 定义树节点类型
interface ForEachTreeNode {
  [key: string]: unknown;
}

/**
 * 遍历树的每个数据
 * @param data 树数据对象
 * @param handler 处理函数
 * @param options 配置项
 * @param options.childrenKey 子节点的key,默认: children
 * @category Array
 */
export function forEachTree<T extends ForEachTreeNode>(
  data: T | T[],
  handler: (item: T) => void,
  options?: { childrenKey?: string },
): void {
  const treeData = Array.isArray(data) ? data : [data];
  const { childrenKey } = {
    childrenKey: 'children',
    ...options,
  };

  treeData.forEach((item) => {
    handler(item);

    // 类型安全地访问子节点
    const children = item[childrenKey];

    // 检查子节点是否存在且为数组
    if (Array.isArray(children) && children.length > 0) {
      forEachTree(children as T[], handler, options);
    }
  });
}

/**
 * @description 递归处理树,返回新的数据
 * @param data 树形数据
 * @param handler 处理节点数据的方法,返回修改后的数据
 * @param option 配置项
 * @param option.childrenKey 子节点的key,默认: children
 * @category Array
 */

// 函数重载：处理单个对象的情况
export function mapTree<T extends Record<string, unknown>, ModifiedData extends Record<string, unknown> = T>(
  data: T,
  handler: (nodeData: T) => ModifiedData,
  options?: { childrenKey?: string },
): ModifiedData;

// 函数重载：处理数组的情况
export function mapTree<T extends Record<string, unknown>, ModifiedData extends Record<string, unknown> = T>(
  data: T[],
  handler: (nodeData: T) => ModifiedData,
  options?: { childrenKey?: string },
): ModifiedData[];

// 实际实现
export function mapTree<
  T extends Record<string, unknown> = Record<string, unknown>,
  ModifiedData extends Record<string, unknown> = T,
>(
  data: T | T[],
  handler: (nodeData: T) => ModifiedData,
  options?: { childrenKey?: string },
): ModifiedData | ModifiedData[] {
  const { childrenKey } = {
    childrenKey: 'children',
    ...options,
  };

  // 处理单个节点的函数
  const processNode = (item: T): ModifiedData => {
    const nodeData = handler(item);
    const children = item[childrenKey];

    if (children && Array.isArray(children)) {
      (nodeData as Record<string, unknown>)[childrenKey] = mapTree(children as T[], handler, options);
    }

    return nodeData;
  };

  // 根据输入类型返回对应类型
  if (Array.isArray(data)) {
    return data.map(processNode);
  } else {
    return processNode(data);
  }
}
