const { CLIEngine } = require('eslint');
const applyAdaptations = require('./applyAdaptations');
const { BASE_RULES, getTypescriptRules } = require('./adaptations');

function makeOverride(cliEngine, glob, adaptations) {
  const globList = Array.isArray(glob) ? glob : [glob];
  const sampleFileName = globList[0].replace(/\*+/g, 'x');

  const config = cliEngine.getConfigForFile(sampleFileName);
  const rules = applyAdaptations(config.rules, adaptations);

  return { files: globList, rules };
}

function addEntries(list, ...entries) {
  if (!list) {
    return entries.filter((e) => (e !== null));
  }
  const r = [...list];
  for (const entry of entries) {
    if (entry !== null && !list.includes(entry)) {
      r.push(entry);
    }
  }
  return r;
}

const GLOBAL_FLAG = 'typescriptEslintConverterRecur';

module.exports = (options, {
  typescriptFiles = ['*.ts', '*.tsx'],
  resolveExtensions = ['js', 'mjs', 'jsx', 'mjsx', 'ts', 'tsx'],
  autoParseResolvableExtensions = true,
  useLoaderStyle = null, // auto-detect by default
  recommended = true,
  indent = false,
} = {}) => {
  if (global[GLOBAL_FLAG]) {
    // running eslint to get current config; avoid recursion
    return options;
  }

  global[GLOBAL_FLAG] = true;

  // CLIEngine is not recommended but still available in 7+
  // We support 5.x and 6.x, so cannot update to ESLint yet
  const cliEngine = new CLIEngine(options);

  const typescriptRules = getTypescriptRules({ indent });

  const baseConfig = options.baseConfig || (useLoaderStyle === false ? {} : options);
  const settings = baseConfig.settings || {};
  const importResolver = settings['import/resolver'] || {};
  const importResolverNode = importResolver.node || {};

  const converted = {
    ...options,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      ...options.parserOptions,
    },
    plugins: addEntries(options.plugins, '@typescript-eslint'),
    baseConfig: {
      ...(options.baseConfig || {}),
      extends: addEntries(
        baseConfig.extends,
        recommended ? 'plugin:@typescript-eslint/recommended' : null,
      ),
      settings: {
        ...settings,
        'import/resolver': {
          ...importResolver,
          node: {
            ...importResolverNode,
            extensions: addEntries(
              importResolverNode.extensions,
              ...resolveExtensions.map((ext) => `.${ext}`)
            ),
          },
        },
      },
      rules: {
        ...baseConfig.rules,
        ...applyAdaptations(cliEngine.getConfigForFile('x').rules, BASE_RULES),
      },
      overrides: [
        ...baseConfig.overrides || [],
        ...typescriptFiles.map((glob) => makeOverride(cliEngine, glob, typescriptRules)),
      ],
    },
  };

  if (autoParseResolvableExtensions) {
    converted.baseConfig.overrides.push(...resolveExtensions.map((ext) => ({
      files: [`*.${ext}`],
    })));
  }

  delete global[GLOBAL_FLAG];

  if (useLoaderStyle === false || (useLoaderStyle !== true && !options.baseConfig)) {
    // .eslintrc style (baseConfig is flattened)
    Object.assign(converted, converted.baseConfig);
    delete converted.baseConfig;
  }

  return converted;
};
