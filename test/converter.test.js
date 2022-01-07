const { CLIEngine } = require('eslint');
const typescriptEslintConverter = require('../index');

const BASE_OPTS = {
  parser: 'espree',
  baseConfig: {
    rules: {},
  },
};

function getRuleConfig(options, filename, rule) {
  const cliEngine = new CLIEngine(options);
  const config = cliEngine.getConfigForFile(filename);
  if (!config) {
    throw new Error(`no configuration for ${filename}\noptions:\n${JSON.stringify(options, null, 2)}`);
  }
  const r = config.rules[rule] || [];
  return Array.isArray(r) ? r : [r];
}

const containsMatching = (fn) => (actual) => {
  if (actual.some(fn)) {
		return { pass: true, message: `Expected not to contain element matching ${fn}, but got ${actual}.` };
  } else {
		return { pass: false, message: `Expected to contain element matching ${fn}, but got ${actual}.` };
  }
};

it('sets the parser', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect(converted.parser).toEqual('@typescript-eslint/parser');
});

it('sets the parser project by default', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect(converted.parserOptions.project).toEqual('./tsconfig.json');
});

it('allows overriding the parser project', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    parserOptions: {
      project: 'something',
    },
  });
  expect(converted.parserOptions.project).toEqual('something');
});

it('adds typescript-eslint/recommended', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect(converted.baseConfig.extends).toEqual([
    'plugin:@typescript-eslint/recommended',
  ]);
  expect(converted.extends).toEqual(undefined);
});

it('does not use baseConfig if not passed in', () => {
  const converted = typescriptEslintConverter({ parser: 'espree' });
  expect(converted.extends).toEqual([
    'plugin:@typescript-eslint/recommended',
  ]);
  expect(converted.baseConfig).toEqual(undefined);
});

it('does not use baseConfig if forced', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, { useLoaderStyle: false });
  expect(converted.extends).toEqual([
    'plugin:@typescript-eslint/recommended',
  ]);
  expect(converted.baseConfig).toEqual(undefined);
});

it('does use baseConfig if forced', () => {
  const converted = typescriptEslintConverter({ parser: 'espree' }, { useLoaderStyle: true });
  expect(converted.baseConfig.extends).toEqual([
    'plugin:@typescript-eslint/recommended',
  ]);
  expect(converted.extends).toEqual(undefined);
});

it('does not add typescript-eslint/recommended if recommended is false', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, { recommended: false });
  expect(converted.baseConfig.extends).toEqual([]);
});

it('preserves existing config extensions', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      extends: ['eslint:recommended'],
    },
  });
  expect(converted.baseConfig.extends).toEqual([
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ]);
});

it('configures import/resolver', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const resolver = converted.baseConfig.settings['import/resolver'];
  expect(resolver.node.extensions).contains('.js');
  expect(resolver.node.extensions).contains('.ts');
  expect(resolver.node.extensions).contains('.tsx');
});

it('uses configurable extensions for import/resolver', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, {
    resolveExtensions: ['woo'],
  });

  const resolver = converted.baseConfig.settings['import/resolver'];
  expect(resolver.node.extensions).contains('.woo');
});

it('creates overrides for typescript files', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const overrides = converted.baseConfig.overrides;
  expect(overrides, containsMatching((o) => o.files.includes('*.ts')));
  expect(overrides, containsMatching((o) => o.files.includes('*.tsx')));
});

it('creates overrides for other known files by default', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const overrides = converted.baseConfig.overrides;
  expect(overrides, containsMatching((o) => o.files.includes('*.js')));
});

it('does not create overrides for other files if autoParseResolvableExtensions = false', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, {
    autoParseResolvableExtensions: false,
  });

  const overrides = converted.baseConfig.overrides;
  expect(overrides).not(containsMatching((o) => o.files.includes('*.js')));
});

it('leaves rules unconfigured if not specified in base config', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const rule = getRuleConfig(converted, 'foo.js', 'react/jsx-filename-extension');

  expect(rule).toEqual([]);
});

it('configures react/jsx-filename-extension', () => {
  const inputExtensions = ['.abc', '.jsw', '.jsd', '.tsd'];

  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'react/jsx-filename-extension': ['warn', {
          foo: 'bar',
          extensions: inputExtensions,
        }],
      },
    },
  });

  const rule = getRuleConfig(converted, 'foo.js', 'react/jsx-filename-extension');
  expect(rule).toEqual(['warn', {
    foo: 'bar',
    extensions: [...inputExtensions, '.tsw'],
  }]);
});

it('configures import/no-extraneous-dependencies', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'import/no-extraneous-dependencies': ['warn', {
          foo: 'bar',
          optionalDependencies: ['**/*.js'],
          peerDependencies: ['**/*.foo.jsx', '**/*.spec.js'],
          devDependencies: ['**/*.foo.woo'],
        }],
      },
    },
  });

  const rule = getRuleConfig(converted, 'foo.js', 'import/no-extraneous-dependencies');
  expect(rule).toEqual(['warn', {
    foo: 'bar',
    optionalDependencies: ['**/*.{js,ts}'],
    peerDependencies: ['**/*.foo.{jsx,tsx}', '**/*.spec.{js,ts}'],
    devDependencies: ['**/*.foo.woo'],
  }]);
});

it('configures import/extensions', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'import/extensions': ['warn', {
          foo: 'never',
          js: 'never',
          jsx: 'always',
        }],
      },
    },
  });

  const rule = getRuleConfig(converted, 'foo.js', 'import/extensions');
  expect(rule).toEqual(['warn', {
    foo: 'never',
    js: 'never',
    jsx: 'always',
    ts: 'never',
    tsx: 'always',
  }]);
});

it('disables rules checked by the compiler for ts files', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'getter-return': ['warn'],
        'no-undef': ['error'],
        'no-const-assign': ['off'],
      },
    },
  });

  expect(getRuleConfig(converted, 'foo.js', 'getter-return')).toEqual(['warn']);
  expect(getRuleConfig(converted, 'foo.jsx', 'getter-return')).toEqual(['warn']);
  expect(getRuleConfig(converted, 'foo.ts', 'getter-return')).toEqual(['off']);
  expect(getRuleConfig(converted, 'foo.tsx', 'getter-return')).toEqual(['off']);

  expect(getRuleConfig(converted, 'foo.js', 'no-undef')).toEqual(['error']);
  expect(getRuleConfig(converted, 'foo.ts', 'no-undef')).toEqual(['off']);

  expect(getRuleConfig(converted, 'foo.js', 'no-const-assign')).toEqual(['off']);
  expect(getRuleConfig(converted, 'foo.ts', 'no-const-assign')).toEqual(['off']);
});

it('translates rules with typescript alternatives', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'brace-style': ['warn', 'stroustrup'],
        'no-dupe-class-members': ['error'],
      },
    },
  });

  expect(getRuleConfig(converted, 'foo.js', 'brace-style')).toEqual(['warn', 'stroustrup']);
  expect(getRuleConfig(converted, 'foo.ts', 'brace-style')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/brace-style')).toEqual(['warn', 'stroustrup']);

  expect(getRuleConfig(converted, 'foo.js', 'no-dupe-class-members')).toEqual(['error']);
  expect(getRuleConfig(converted, 'foo.ts', 'no-dupe-class-members')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/no-dupe-class-members')).toEqual(['error']);
});

it('leaves typescript rules unchanged if configured', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'brace-style': ['warn', 'stroustrup'],
        '@typescript-eslint/brace-style': ['error'],
      },
    },
  });

  expect(getRuleConfig(converted, 'foo.js', 'brace-style')).toEqual(['warn', 'stroustrup']);
  expect(getRuleConfig(converted, 'foo.ts', 'brace-style')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/brace-style')).toEqual(['error']);
});

it('disables indent by default', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'indent': ['error', 2],
      },
    },
  });

  expect(getRuleConfig(converted, 'foo.js', 'indent')).toEqual(['error', 2]);
  expect(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent')).toEqual([]);

  expect(getRuleConfig(converted, 'foo.ts', 'indent')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent')).toEqual([]);
});

it('preserves existing @typescript-eslint/indent config', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'indent': ['error', 2],
        '@typescript-eslint/indent': ['warn', 4],
      },
    },
  });

  expect(getRuleConfig(converted, 'foo.ts', 'indent')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent')).toEqual(['warn', 4]);
});

it('converts indent if requested', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      rules: {
        'indent': ['error', 2],
      },
    },
  }, { indent: true });

  expect(getRuleConfig(converted, 'foo.js', 'indent')).toEqual(['error', 2]);
  expect(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent')).toEqual([]);

  expect(getRuleConfig(converted, 'foo.ts', 'indent')[0]).toEqual('off');
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent')).toEqual(['error', 2]);
});

it('does not convert indent if not specified', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, { indent: true });

  expect(getRuleConfig(converted, 'foo.js', 'indent')).toEqual([]);
  expect(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent')).toEqual([]);

  expect(getRuleConfig(converted, 'foo.ts', 'indent')).toEqual([]);
  expect(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent')).toEqual([]);
});
