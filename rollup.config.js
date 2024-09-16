import { builtinModules } from 'module';
import json from '@rollup/plugin-json';
import ts from 'rollup-plugin-ts';
import { nodeResolve } from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import terser from '@rollup/plugin-terser';
import cleanup from 'rollup-plugin-cleanup';
import summary from 'rollup-plugin-summary';
import { visualizer } from 'rollup-plugin-visualizer';

const IS_PROD = !process.env.ROLLUP_WATCH;

/**
 * @description 获取构建插件
 * @param {{[key: 'json'|'ts'|'nodeResolve'|'commonjs'|'terser'|'cleanup'|'summary'|'visualizer']: object}} [options]
 * @param {('json'|'ts'|'nodeResolve'|'commonjs'|'terser'|'cleanup'|'summary'|'visualizer')[]} [ignorePlugins]
 * @returns
 */
function getPlugins(options = {}, ignorePlugins = []) {
  return [
    !ignorePlugins.includes('json') && json(options.json || undefined),
    !ignorePlugins.includes('ts') && ts(options.ts || undefined),
    // 如果目标是node环境,需要提供选项{ exportConditions: ["node"] }以支持构建
    // !ignorePlugins.includes('nodeResolve') && nodeResolve(options.nodeResolve || undefined),
    !ignorePlugins.includes('commonjs') && commonjs(options.commonjs || undefined),
    IS_PROD && !ignorePlugins.includes('terser') && terser(options.terser || undefined),
    IS_PROD && !ignorePlugins.includes('cleanup') && cleanup({ comments: 'none', ...(options.cleanup || {}) }),
    IS_PROD &&
      !ignorePlugins.includes('summary') &&
      summary({
        showGzippedSize: true,
        ...(options.summary || {}),
      }),
    IS_PROD &&
      !ignorePlugins.includes('visualizer') &&
      visualizer({
        gzipSize: true,
        // template: 'treemap', // network, treemap,sunburst, default: treemap
        ...(options.visualizer || {}),
      }),
  ].filter((item) => !!item);
}

/**
 * @description 获取要排除的外部选项
 * @param {string[]} additionalExternal
 * @return {string[]}
 */
function getExternal(additionalExternal = []) {
  return [...builtinModules].concat(additionalExternal || []);
}

/**
 * @description 获取输出配置项
 * @param options 文档: https://www.rollupjs.com/guide/big-list-of-options
 * @return {Record<string, unknown>}
 */
function getOutput(options = {}) {
  return {
    dir: 'dist',
    format: 'es',
    chunkFileNames: 'bundle/chunk.[format].[hash].js',
    entryFileNames: '[name].[format].js',
    sourcemap: IS_PROD,
    ...options,
  };
}

export default [
  // umd
  IS_PROD && {
    input: 'src/web.ts',
    output: getOutput({
      format: 'umd',
      file: 'dist/compass-helpers.umd.js',
      name: 'CompassHelpers', // Set your library name.
      dir: undefined,
      chunkFileNames: undefined,
      entryFileNames: undefined,
      exports: 'auto',
    }),
    external: getExternal(),
    plugins: getPlugins({
      ts: {
        tsconfig: './tsconfig.web.json',
      },
      nodeResolve: { browser: true },
    }),
  },
  // node cjs
  IS_PROD && {
    input: 'src/node.ts',
    output: getOutput({
      format: 'cjs',
      exports: 'auto',
      entryFileNames: '[name].cjs',
    }),
    external: getExternal(),
    plugins: getPlugins({
      ts: {
        tsconfig: './tsconfig.node.json',
      },
      nodeResolve: { browser: false, exportConditions: ['node'] },
    }),
  },
  // node esm
  IS_PROD && {
    input: 'src/node.ts',
    output: getOutput({
      entryFileNames: '[name].mjs',
    }),
    external: getExternal(),
    plugins: getPlugins({
      ts: {
        tsconfig: './tsconfig.node.json',
      },
      nodeResolve: { browser: false, exportConditions: ['node'] },
    }),
  },
  // browser
  {
    input: 'src/web.ts',
    output: getOutput(),
    external: getExternal(),
    plugins: getPlugins({
      ts: {
        tsconfig: './tsconfig.web.json',
      },
    }),
    watch: {
      include: ['src/**', 'index.html'],
    },
  },
].filter((item) => !!item);
