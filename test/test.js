const { CLIEngine } = require('eslint');
const { it, expect } = require('./framework');
const typescriptEslintConverter = require('../index');

const BASE_OPTS = {
  parser: 'espree',
  rules: {},
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

it('sets the parser', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect.equal(converted.parser, '@typescript-eslint/parser');
});

it('sets the parser project by default', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect.equal(converted.parserOptions.project, './tsconfig.json');
});

it('allows overriding the parser project', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    parserOptions: {
      project: 'something',
    },
  });
  expect.equal(converted.parserOptions.project, 'something');
});

it('adds typescript-eslint/recommended', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);
  expect.equal(converted.baseConfig.extends, [
    'plugin:@typescript-eslint/recommended',
  ]);
});

it('does not add typescript-eslint/recommended if recommended is false', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, { recommended: false });
  expect.equal(converted.baseConfig.extends, []);
});

it('preserves existing config extensions', () => {
  const converted = typescriptEslintConverter({
    ...BASE_OPTS,
    baseConfig: {
      extends: ['eslint:recommended'],
    },
  });
  expect.equal(converted.baseConfig.extends, [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
  ]);
});

it('configures import/resolver', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const resolver = converted.baseConfig.settings['import/resolver'];
  expect.containsAll(resolver.node.extensions, ['.js', '.ts', '.tsx']);
});

it('uses configurable extensions for import/resolver', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, {
    resolveExtensions: ['woo'],
  });

  const resolver = converted.baseConfig.settings['import/resolver'];
  expect.containsAll(resolver.node.extensions, ['.woo']);
});

it('creates overrides for typescript files', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const overrides = converted.baseConfig.overrides;
  expect.containsAll(overrides, [
    (o) => o.files.includes('*.ts'),
    (o) => o.files.includes('*.tsx'),
  ]);
});

it('creates overrides for other known files by default', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const overrides = converted.baseConfig.overrides;
  expect.contains(overrides, (o) => o.files.includes('*.js'));
});

it('does not create overrides for other files if autoParseResolvableExtensions = false', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, {
    autoParseResolvableExtensions: false,
  });

  const overrides = converted.baseConfig.overrides;
  expect.not.contains(overrides, (o) => o.files.includes('*.js'));
});

it('leaves rules unconfigured if not specified in base config', () => {
  const converted = typescriptEslintConverter(BASE_OPTS);

  const rule = getRuleConfig(converted, 'foo.js', 'react/jsx-filename-extension');

  expect.equal(rule, []);
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
  expect.equal(rule, ['warn', {
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
  expect.equal(rule, ['warn', {
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
  expect.equal(rule, ['warn', {
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

  expect.equal(getRuleConfig(converted, 'foo.js', 'getter-return'), ['warn']);
  expect.equal(getRuleConfig(converted, 'foo.jsx', 'getter-return'), ['warn']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'getter-return'), ['off']);
  expect.equal(getRuleConfig(converted, 'foo.tsx', 'getter-return'), ['off']);

  expect.equal(getRuleConfig(converted, 'foo.js', 'no-undef'), ['error']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'no-undef'), ['off']);

  expect.equal(getRuleConfig(converted, 'foo.js', 'no-const-assign'), ['off']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'no-const-assign'), ['off']);
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

  expect.equal(getRuleConfig(converted, 'foo.js', 'brace-style'), ['warn', 'stroustrup']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'brace-style')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/brace-style'), ['warn', 'stroustrup']);

  expect.equal(getRuleConfig(converted, 'foo.js', 'no-dupe-class-members'), ['error']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'no-dupe-class-members')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/no-dupe-class-members'), ['error']);
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

  expect.equal(getRuleConfig(converted, 'foo.js', 'brace-style'), ['warn', 'stroustrup']);
  expect.equal(getRuleConfig(converted, 'foo.ts', 'brace-style')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/brace-style'), ['error']);
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

  expect.equal(getRuleConfig(converted, 'foo.js', 'indent'), ['error', 2]);
  expect.equal(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent'), []);

  expect.equal(getRuleConfig(converted, 'foo.ts', 'indent')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent'), []);
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

  expect.equal(getRuleConfig(converted, 'foo.ts', 'indent')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent'), ['warn', 4]);
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

  expect.equal(getRuleConfig(converted, 'foo.js', 'indent'), ['error', 2]);
  expect.equal(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent'), []);

  expect.equal(getRuleConfig(converted, 'foo.ts', 'indent')[0], 'off');
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent'), ['error', 2]);
});

it('does not convert indent if not specified', () => {
  const converted = typescriptEslintConverter(BASE_OPTS, { indent: true });

  expect.equal(getRuleConfig(converted, 'foo.js', 'indent'), []);
  expect.equal(getRuleConfig(converted, 'foo.js', '@typescript-eslint/indent'), []);

  expect.equal(getRuleConfig(converted, 'foo.ts', 'indent'), []);
  expect.equal(getRuleConfig(converted, 'foo.ts', '@typescript-eslint/indent'), []);
});
