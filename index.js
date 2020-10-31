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

module.exports = (options, {
  typescriptFiles = ['*.ts', '*.tsx'],
  resolveExtensions = ['js', 'mjs', 'jsx', 'mjsx', 'ts', 'tsx'],
  autoParseResolvableExtensions = true,
  recommended = true,
  indent = false,
} = {}) => {
  // CLIEngine is not recommended but still available in 7+
  // We support 5.x and 6.x, so cannot update to ESLint yet
  const cliEngine = new CLIEngine(options);

  const typescriptRules = getTypescriptRules({ indent });

  // Support NodeJS <14 (no support for ?. syntax)
  const baseConfig = options.baseConfig || {};
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
      ...baseConfig,
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

  return converted;
};
