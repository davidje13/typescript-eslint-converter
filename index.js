const { CLIEngine } = require('eslint');
const applyAdaptations = require('./applyAdaptations');
const { BASE_RULES, TYPESCRIPT_RULES } = require('./adaptations');

function makeOverride(cliEngine, glob, adaptations) {
  const globList = Array.isArray(glob) ? glob : [glob];
  const sampleFileName = globList[0].replace(/\*+/g, 'x');

  const config = cliEngine.getConfigForFile(sampleFileName);
  const rules = applyAdaptations(config.rules, adaptations);

  return { files: globList, rules };
}

function addEntries(list, ...entries) {
  if (!list) {
    return entries;
  }
  const r = [...list];
  for (const entry of entries) {
    if (!list.includes(entry)) {
      r.push(entry);
    }
  }
  return r;
}

module.exports = (options, {
  typescriptFiles = ['*.ts', '*.tsx'],
  resolveExtensions = ['js', 'mjs', 'jsx', 'mjsx', 'ts', 'tsx'],
  autoParseResolvableExtensions = true,
} = {}) => {
  // CLIEngine is not recommended but still available in 7+
  // We support 5.x and 6.x, so cannot update to ESLint yet
  const cliEngine = new CLIEngine(options);

  const converted = {
    ...options,
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: './tsconfig.json',
      ...options.parserOptions,
    },
    plugins: addEntries(options.plugins, '@typescript-eslint'),
    baseConfig: {
      ...options.baseConfig,
      extends: addEntries(
        options.baseConfig?.extends,
        'plugin:@typescript-eslint/recommended',
      ),
      settings: {
        ...options.baseConfig?.settings,
        'import/resolver': {
          ...options.baseConfig?.settings?.['import/resolver'],
          node: {
            ...options.baseConfig?.settings?.['import/resolver']?.node,
            extensions: addEntries(
              options.baseConfig?.settings?.['import/resolver']?.node?.extensions,
              ...resolveExtensions.map((ext) => `.${ext}`)
            ),
          },
        },
      },
      rules: {
        ...options.baseConfig?.rules,
        ...applyAdaptations(cliEngine.getConfigForFile('x').rules, BASE_RULES),
      },
      overrides: [
        ...options.baseConfig?.overrides || [],
        ...typescriptFiles.map((glob) => makeOverride(cliEngine, glob, TYPESCRIPT_RULES)),
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
