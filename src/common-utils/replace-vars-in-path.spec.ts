import replaceVarsInPath, { type VariableValue } from './replace-vars-in-path';

describe('replaceVarsInPath', () => {
  // 基础功能测试
  describe('基础功能测试', () => {
    it('应该替换基本的路径变量', () => {
      const result = replaceVarsInPath('/api/user/:id', { id: '123' });
      expect(result).toBe('/api/user/123');
    });

    it('应该替换多个路径变量', () => {
      const result = replaceVarsInPath('/api/user/:id/post/:postId', {
        id: '123',
        postId: '456',
      });
      expect(result).toBe('/api/user/123/post/456');
    });

    it('应该处理没有变量的路径', () => {
      const result = replaceVarsInPath('/api/users', { id: '123' });
      expect(result).toBe('/api/users');
    });

    it('应该处理空参数对象', () => {
      const result = replaceVarsInPath('/api/users', {});
      expect(result).toBe('/api/users');
    });

    it('应该处理根路径', () => {
      const result = replaceVarsInPath('/:version', { version: 'v1' });
      expect(result).toBe('/v1');
    });
  });

  // 数据类型支持测试
  describe('数据类型支持测试', () => {
    it('应该支持数字类型', () => {
      const result = replaceVarsInPath('/api/user/:id', { id: 123 });
      expect(result).toBe('/api/user/123');
    });

    it('应该支持布尔类型', () => {
      const result = replaceVarsInPath('/api/feature/:enabled', { enabled: true });
      expect(result).toBe('/api/feature/true');
    });

    it('应该支持null值', () => {
      const result = replaceVarsInPath('/api/user/:data', { data: null });
      expect(result).toBe('/api/user/null');
    });

    it('应该支持undefined值', () => {
      const result = replaceVarsInPath('/api/user/:data', { data: undefined });
      expect(result).toBe('/api/user/undefined');
    });

    it('应该支持混合数据类型', () => {
      const result = replaceVarsInPath('/api/user/:id/active/:status/score/:score', {
        id: 123,
        status: false,
        score: null,
      });
      expect(result).toBe('/api/user/123/active/false/score/null');
    });
  });

  // 变量名处理测试
  describe('变量名处理测试', () => {
    it('应该避免长短变量名冲突', () => {
      const result = replaceVarsInPath('/api/:id/user/:userId', {
        id: '123',
        userId: '456',
      });
      expect(result).toBe('/api/123/user/456');
    });

    it('应该正确处理相同的变量名', () => {
      const result = replaceVarsInPath('/api/:id/copy/:id', { id: '123' });
      expect(result).toBe('/api/123/copy/123');
    });

    it('应该处理变量名包含数字和下划线', () => {
      const result = replaceVarsInPath('/api/:user_id1/:item2', {
        user_id1: '123',
        item2: '456',
      });
      expect(result).toBe('/api/123/456');
    });

    it('应该只匹配完整的变量名', () => {
      const result = replaceVarsInPath('/api/:id/:identity', {
        id: '123',
        identity: 'admin',
      });
      expect(result).toBe('/api/123/admin');
    });
  });

  // 自定义前缀测试
  describe('自定义前缀测试', () => {
    it('应该支持花括号前缀', () => {
      const result = replaceVarsInPath(
        '/api/user/{id}',
        { id: '123' },
        {
          prefix: '{',
        },
      );
      expect(result).toBe('/api/user/123}');
    });

    it('应该支持美元符号前缀', () => {
      const result = replaceVarsInPath(
        '/api/user/$id',
        { id: '123' },
        {
          prefix: '$',
        },
      );
      expect(result).toBe('/api/user/123');
    });

    it('应该支持多字符前缀', () => {
      const result = replaceVarsInPath(
        '/api/user/{{id}}',
        { id: '123' },
        {
          prefix: '{{',
        },
      );
      expect(result).toBe('/api/user/123}}');
    });

    it('应该正确转义正则表达式特殊字符', () => {
      const result = replaceVarsInPath(
        '/api/user/(id)',
        { id: '123' },
        {
          prefix: '(',
        },
      );
      expect(result).toBe('/api/user/123)');
    });
  });

  // URL编码测试
  describe('URL编码测试', () => {
    it('应该对含有空格的值进行编码', () => {
      const result = replaceVarsInPath(
        '/search/:query',
        { query: 'hello world' },
        {
          encodeValue: true,
        },
      );
      expect(result).toBe('/search/hello%20world');
    });

    it('应该对特殊字符进行编码', () => {
      const result = replaceVarsInPath(
        '/api/:path',
        { path: 'user/123?active=true' },
        {
          encodeValue: true,
        },
      );
      expect(result).toBe('/api/user%2F123%3Factive%3Dtrue');
    });

    it('应该在默认情况下不进行编码', () => {
      const result = replaceVarsInPath('/search/:query', { query: 'hello world' });
      expect(result).toBe('/search/hello world');
    });

    it('应该对中文进行编码', () => {
      const result = replaceVarsInPath(
        '/search/:query',
        { query: '搜索内容' },
        {
          encodeValue: true,
        },
      );
      expect(result).toBe('/search/%E6%90%9C%E7%B4%A2%E5%86%85%E5%AE%B9');
    });
  });

  // 严格模式测试
  describe('严格模式测试', () => {
    it('应该在严格模式下抛出未定义变量错误', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id', {}, { strict: true });
      }).toThrow('路径变量替换失败: 严格模式下不允许存在未定义的路径变量');
    });

    it('应该在严格模式下成功替换所有变量', () => {
      const result = replaceVarsInPath('/api/user/:id', { id: '123' }, { strict: true });
      expect(result).toBe('/api/user/123');
    });

    it('应该在严格模式下处理多个未定义变量', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id/post/:postId', { id: '123' }, { strict: true });
      }).toThrow('路径变量替换失败: 严格模式下存在未定义的路径变量: :postId');
    });

    it('应该在严格模式下允许无变量路径', () => {
      const result = replaceVarsInPath('/api/users', {}, { strict: true });
      expect(result).toBe('/api/users');
    });
  });

  // 默认值测试
  describe('默认值测试', () => {
    it('应该使用默认值替换未定义变量', () => {
      const result = replaceVarsInPath('/api/user/:id', {}, { defaultValue: 'unknown' });
      expect(result).toBe('/api/user/unknown');
    });

    it('应该只替换未定义的变量为默认值', () => {
      const result = replaceVarsInPath(
        '/api/user/:id/post/:postId',
        { id: '123' },
        {
          defaultValue: 'missing',
        },
      );
      expect(result).toBe('/api/user/123/post/missing');
    });

    it('应该支持空字符串作为默认值', () => {
      const result = replaceVarsInPath('/api/user/:id', {}, { defaultValue: '' });
      expect(result).toBe('/api/user/');
    });

    it('应该对默认值进行URL编码', () => {
      const result = replaceVarsInPath(
        '/api/user/:id',
        {},
        {
          defaultValue: 'not found',
          encodeValue: true,
        },
      );
      expect(result).toBe('/api/user/not%20found');
    });
  });

  // 复杂场景测试
  describe('复杂场景测试', () => {
    it('应该处理复杂的RESTful路径', () => {
      const result = replaceVarsInPath('/api/v:version/:resource/:id/:action', {
        version: '1',
        resource: 'users',
        id: '123',
        action: 'edit',
      });
      expect(result).toBe('/api/v1/users/123/edit');
    });

    it('应该处理查询参数样式的路径', () => {
      const result = replaceVarsInPath('/search?q=:query&type=:type', {
        query: 'test',
        type: 'user',
      });
      expect(result).toBe('/search?q=test&type=user');
    });

    it('应该与URL编码和默认值组合使用', () => {
      const result = replaceVarsInPath(
        '/api/:category/:item',
        { category: 'food & drink' },
        {
          defaultValue: 'all items',
          encodeValue: true,
        },
      );
      expect(result).toBe('/api/food%20%26%20drink/all%20items');
    });
  });

  // 错误处理测试
  describe('错误处理测试', () => {
    it('应该拒绝非字符串路径', () => {
      expect(() => {
        replaceVarsInPath(123 as unknown as string, { id: '123' });
      }).toThrow('路径变量替换失败: 路径字符串必须为字符串类型');
    });

    it('应该拒绝null路径', () => {
      expect(() => {
        replaceVarsInPath(null as unknown as string, { id: '123' });
      }).toThrow('路径变量替换失败: 路径字符串必须为字符串类型');
    });

    it('应该拒绝undefined路径', () => {
      expect(() => {
        replaceVarsInPath(undefined as unknown as string, { id: '123' });
      }).toThrow('路径变量替换失败: 路径字符串必须为字符串类型');
    });

    it('应该拒绝null参数对象', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id', null as unknown as Record<string, VariableValue>);
      }).toThrow('路径变量替换失败: 参数对象必须为有效的对象类型');
    });

    it('应该拒绝数组作为参数对象', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id', ['123'] as unknown as Record<string, VariableValue>);
      }).toThrow('路径变量替换失败: 参数对象必须为有效的对象类型');
    });

    it('应该拒绝空前缀', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id', { id: '123' }, { prefix: '' });
      }).toThrow('路径变量替换失败: 前缀必须为非空字符串');
    });

    it('应该拒绝非字符串前缀', () => {
      expect(() => {
        replaceVarsInPath('/api/user/:id', { id: '123' }, { prefix: 123 as unknown as string });
      }).toThrow('路径变量替换失败: 前缀必须为非空字符串');
    });
  });

  // 边界情况测试
  describe('边界情况测试', () => {
    it('应该处理路径开头的变量', () => {
      const result = replaceVarsInPath(':version/api/users', { version: 'v1' });
      expect(result).toBe('v1/api/users');
    });

    it('应该处理路径结尾的变量', () => {
      const result = replaceVarsInPath('/api/users/:format', { format: 'json' });
      expect(result).toBe('/api/users/json');
    });

    it('应该处理只有变量的路径', () => {
      const result = replaceVarsInPath(':path', { path: 'home' });
      expect(result).toBe('home');
    });

    it('应该处理连续的变量', () => {
      const result = replaceVarsInPath('/:a/:b/:c', { a: '1', b: '2', c: '3' });
      expect(result).toBe('/1/2/3');
    });

    it('应该处理极长的变量名', () => {
      const longVarName = 'a'.repeat(100);
      const result = replaceVarsInPath(`/api/:${longVarName}`, {
        [longVarName]: 'value',
      });
      expect(result).toBe('/api/value');
    });

    it('应该处理包含路径分隔符的变量值', () => {
      const result = replaceVarsInPath('/api/:path', { path: 'user/123/profile' });
      expect(result).toBe('/api/user/123/profile');
    });
  });

  // 性能和兼容性测试
  describe('性能和兼容性测试', () => {
    it('应该正确处理大量变量', () => {
      const pathParts = Array.from({ length: 20 }, (_, i) => `:var${i}`);
      const path = `/${pathParts.join('/')}`;
      const params = Array.from({ length: 20 }, (_, i) => ({ [`var${i}`]: `value${i}` })).reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {},
      );

      const result = replaceVarsInPath(path, params);
      const expected = `/${Array.from({ length: 20 }, (_, i) => `value${i}`).join('/')}`;
      expect(result).toBe(expected);
    });

    it('应该处理包含特殊Unicode字符的变量值', () => {
      const result = replaceVarsInPath('/api/user/:name', { name: '张三' });
      expect(result).toBe('/api/user/张三');
    });

    it('应该处理包含emoji的变量值', () => {
      const result = replaceVarsInPath('/api/status/:mood', { mood: '😊' });
      expect(result).toBe('/api/status/😊');
    });

    it('应该正确处理Windows路径风格', () => {
      const result = replaceVarsInPath('\\api\\user\\:id', { id: '123' });
      expect(result).toBe('\\api\\user\\123');
    });
  });
});
