import replaceVariablesInString, { type VariableValue } from './replace-variables-in-string';

describe('replaceVariablesInString', () => {
  // 基础功能测试
  describe('基础功能测试', () => {
    it('应该替换基本的字符串变量', () => {
      const result = replaceVariablesInString('Hello {{name}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('应该替换多个变量', () => {
      const template = 'Hello {{name}}, you are {{age}} years old!';
      const params = { name: 'Alice', age: '25' };
      const result = replaceVariablesInString(template, params);
      expect(result).toBe('Hello Alice, you are 25 years old!');
    });

    it('应该处理空模板字符串', () => {
      const result = replaceVariablesInString('', { name: 'World' });
      expect(result).toBe('');
    });

    it('应该处理没有变量的模板', () => {
      const result = replaceVariablesInString('Hello World!', { name: 'Alice' });
      expect(result).toBe('Hello World!');
    });

    it('应该处理空参数对象', () => {
      const result = replaceVariablesInString('Hello World!', {});
      expect(result).toBe('Hello World!');
    });
  });

  // 数据类型支持测试
  describe('数据类型支持测试', () => {
    it('应该支持数字类型', () => {
      const result = replaceVariablesInString('Count: {{count}}', { count: 42 });
      expect(result).toBe('Count: 42');
    });

    it('应该支持布尔类型', () => {
      const result = replaceVariablesInString('Active: {{isActive}}', { isActive: true });
      expect(result).toBe('Active: true');
    });

    it('应该支持null值', () => {
      const result = replaceVariablesInString('Value: {{value}}', { value: null });
      expect(result).toBe('Value: null');
    });

    it('应该支持undefined值', () => {
      const result = replaceVariablesInString('Value: {{value}}', { value: undefined });
      expect(result).toBe('Value: undefined');
    });

    it('应该支持混合数据类型', () => {
      const template = 'ID: {{id}}, Name: {{name}}, Active: {{active}}, Score: {{score}}';
      const params = {
        id: 123,
        name: 'Test',
        active: false,
        score: null,
      };
      const result = replaceVariablesInString(template, params);
      expect(result).toBe('ID: 123, Name: Test, Active: false, Score: null');
    });
  });

  // 变量名处理测试
  describe('变量名处理测试', () => {
    it('应该处理包含空格的变量标记', () => {
      const result = replaceVariablesInString('Hello {{ name }}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('应该处理多种空白字符', () => {
      const result = replaceVariablesInString('Hello {{\tname\t}}!', { name: 'World' });
      expect(result).toBe('Hello World!');
    });

    it('应该避免长短变量名冲突', () => {
      const template = '{{name}} and {{n}}';
      const params = { name: 'Alice', n: 'Bob' };
      const result = replaceVariablesInString(template, params);
      expect(result).toBe('Alice and Bob');
    });

    it('应该支持重复的变量', () => {
      const result = replaceVariablesInString('{{name}} loves {{name}}!', { name: 'Alice' });
      expect(result).toBe('Alice loves Alice!');
    });
  });

  // 自定义包裹符号测试
  describe('自定义包裹符号测试', () => {
    it('应该支持方括号包裹符号', () => {
      const result = replaceVariablesInString(
        'Hello [name]!',
        { name: 'World' },
        {
          wrapper: ['[', ']'],
        },
      );
      expect(result).toBe('Hello World!');
    });

    it('应该支持百分号包裹符号', () => {
      const result = replaceVariablesInString(
        'Hello %name%!',
        { name: 'World' },
        {
          wrapper: ['%', '%'],
        },
      );
      expect(result).toBe('Hello World!');
    });

    it('应该支持特殊字符包裹符号', () => {
      const result = replaceVariablesInString(
        'Hello ${{name}}$!',
        { name: 'World' },
        {
          wrapper: ['${{', '}}$'],
        },
      );
      expect(result).toBe('Hello World!');
    });

    it('应该正确转义正则表达式特殊字符', () => {
      const result = replaceVariablesInString(
        'Hello (name)!',
        { name: 'World' },
        {
          wrapper: ['(', ')'],
        },
      );
      expect(result).toBe('Hello World!');
    });
  });

  // 严格模式测试
  describe('严格模式测试', () => {
    it('应该在严格模式下抛出未定义变量错误', () => {
      expect(() => {
        replaceVariablesInString('Hello {{name}}!', {}, { strict: true });
      }).toThrow('变量替换失败: 严格模式下不允许存在未定义的变量');
    });

    it('应该在严格模式下成功替换所有变量', () => {
      const result = replaceVariablesInString('Hello {{name}}!', { name: 'World' }, { strict: true });
      expect(result).toBe('Hello World!');
    });

    it('应该在严格模式下处理多个未定义变量', () => {
      expect(() => {
        replaceVariablesInString('{{greeting}} {{name}}!', { greeting: 'Hello' }, { strict: true });
      }).toThrow('变量替换失败: 严格模式下存在未定义的变量');
    });

    it('应该在严格模式下允许空模板', () => {
      const result = replaceVariablesInString('No variables here', {}, { strict: true });
      expect(result).toBe('No variables here');
    });
  });

  // 默认值测试
  describe('默认值测试', () => {
    it('应该使用默认值替换未定义变量', () => {
      const result = replaceVariablesInString('Hello {{name}}!', {}, { defaultValue: 'Guest' });
      expect(result).toBe('Hello Guest!');
    });

    it('应该只替换未定义的变量为默认值', () => {
      const template = 'Hello {{name}}, welcome to {{place}}!';
      const params = { name: 'Alice' };
      const result = replaceVariablesInString(template, params, { defaultValue: 'Unknown' });
      expect(result).toBe('Hello Alice, welcome to Unknown!');
    });

    it('应该支持空字符串作为默认值', () => {
      const result = replaceVariablesInString('Hello {{name}}!', {}, { defaultValue: '' });
      expect(result).toBe('Hello !');
    });
  });

  // 复杂场景测试
  describe('复杂场景测试', () => {
    it('应该处理包含特殊字符的变量值', () => {
      const result = replaceVariablesInString('Message: {{msg}}', {
        msg: 'Hello {{world}}! This is a $pecial message.',
      });
      expect(result).toBe('Message: Hello {{world}}! This is a $pecial message.');
    });

    it('应该处理长模板字符串', () => {
      const template = '{{title}}: {{description}}. Created by {{author}} on {{date}}. Status: {{status}}.';
      const params = {
        title: 'Sample Article',
        description: 'This is a sample article description',
        author: 'John Doe',
        date: '2023-12-01',
        status: 'Published',
      };
      const result = replaceVariablesInString(template, params);
      expect(result).toBe(
        'Sample Article: This is a sample article description. Created by John Doe on 2023-12-01. Status: Published.',
      );
    });

    it('应该处理嵌套样式的模板', () => {
      const result = replaceVariablesInString('{{outer}} contains {{inner}}', {
        outer: 'Box',
        inner: 'Items',
      });
      expect(result).toBe('Box contains Items');
    });
  });

  // 错误处理测试
  describe('错误处理测试', () => {
    it('应该拒绝非字符串模板', () => {
      expect(() => {
        replaceVariablesInString(123 as unknown as string, { name: 'World' });
      }).toThrow('变量替换失败: 模板字符串必须为字符串类型');
    });

    it('应该拒绝null模板', () => {
      expect(() => {
        replaceVariablesInString(null as unknown as string, { name: 'World' });
      }).toThrow('变量替换失败: 模板字符串必须为字符串类型');
    });

    it('应该拒绝undefined模板', () => {
      expect(() => {
        replaceVariablesInString(undefined as unknown as string, { name: 'World' });
      }).toThrow('变量替换失败: 模板字符串必须为字符串类型');
    });

    it('应该拒绝null参数对象', () => {
      expect(() => {
        replaceVariablesInString('Hello {{name}}!', null as unknown as Record<string, VariableValue>);
      }).toThrow('变量替换失败: 参数对象必须为有效的对象类型');
    });

    it('应该拒绝数组作为参数对象', () => {
      expect(() => {
        replaceVariablesInString('Hello {{name}}!', ['World'] as unknown as Record<string, VariableValue>);
      }).toThrow('变量替换失败: 参数对象必须为有效的对象类型');
    });

    it('应该拒绝无效的包裹符号', () => {
      expect(() => {
        replaceVariablesInString(
          'Hello {{name}}!',
          { name: 'World' },
          {
            wrapper: ['{{'] as unknown as [string, string],
          },
        );
      }).toThrow('变量替换失败: 包裹符号必须为包含2个元素的数组');
    });

    it('应该支持相同的开始和结束包裹符号', () => {
      const result = replaceVariablesInString(
        'Hello |name|!',
        { name: 'World' },
        {
          wrapper: ['|', '|'],
        },
      );
      expect(result).toBe('Hello World!');
    });
  });

  // 边界情况测试
  describe('边界情况测试', () => {
    it('应该处理只有包裹符号的模板', () => {
      const result = replaceVariablesInString('{{}}', {});
      expect(result).toBe('{{}}');
    });

    it('应该处理不完整的包裹符号', () => {
      const result = replaceVariablesInString('Hello {{name!', { name: 'World' });
      expect(result).toBe('Hello {{name!');
    });

    it('应该处理变量名包含数字的情况', () => {
      const result = replaceVariablesInString('Item {{item1}} and {{item2}}', {
        item1: 'First',
        item2: 'Second',
      });
      expect(result).toBe('Item First and Second');
    });

    it('应该处理变量名包含下划线的情况', () => {
      const result = replaceVariablesInString('User {{user_name}} has {{user_age}} years', {
        user_name: 'Alice',
        user_age: 25,
      });
      expect(result).toBe('User Alice has 25 years');
    });

    it('应该处理极长的变量名', () => {
      const longVarName = 'a'.repeat(100);
      const result = replaceVariablesInString(`Hello {{${longVarName}}}!`, {
        [longVarName]: 'World',
      });
      expect(result).toBe('Hello World!');
    });
  });

  // 性能和兼容性测试
  describe('性能和兼容性测试', () => {
    it('应该正确处理大量变量', () => {
      const template = Array.from({ length: 50 }, (_, i) => `{{var${i}}}`).join(' ');
      const params = Array.from({ length: 50 }, (_, i) => ({ [`var${i}`]: `value${i}` })).reduce(
        (acc, curr) => ({ ...acc, ...curr }),
        {},
      );

      const result = replaceVariablesInString(template, params);
      const expected = Array.from({ length: 50 }, (_, i) => `value${i}`).join(' ');
      expect(result).toBe(expected);
    });

    it('应该处理包含特殊Unicode字符的变量值', () => {
      const result = replaceVariablesInString('Hello {{name}}! {{emoji}}', {
        name: '世界',
        emoji: '🌍',
      });
      expect(result).toBe('Hello 世界! 🌍');
    });

    it('应该处理包含换行符的模板', () => {
      const template = `Line 1: {{line1}}
Line 2: {{line2}}`;
      const params = { line1: 'First', line2: 'Second' };
      const result = replaceVariablesInString(template, params);
      expect(result).toBe(`Line 1: First
Line 2: Second`);
    });
  });
});
