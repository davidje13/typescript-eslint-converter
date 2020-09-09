# TypeScript ESLint Converter

Automatic ESLint rule conversions for TypeScript.

ESLint [replaces TSLint](https://eslint.org/blog/2019/01/future-typescript-eslint) for linting TypeScript.

Existing JavaScript rules will be converted to support TypeScript, so you can combine this with base configurations
such as airbnb easily. See below for full details.

## Installation

This assumes you have already installed and configured eslint.

```bash
npm install --save-dev typescript-eslint-converter
```

Change your `.eslintrc.js`:

```javascript
const typescriptEslintConverter = require('typescript-eslint-converter');

module.exports = typescriptEslintConverter({
  /* existing configuration here */
});
```

### Customisation

By default, `ts` and `tsx` files will be handled as TypeScript. You can customise this if needed:

```javascript
const typescriptEslintConverter = require('typescript-eslint-converter');

module.exports = typescriptEslintConverter({
  /* existing configuration here */
}, {
  // default values are shown:
  typescriptFiles: ['*.ts', '*.tsx'],
  resolveExtensions: ['js', 'mjs', 'jsx', 'mjsx', 'ts', 'tsx'],
  autoParseResolvableExtensions: true,
});
```

- `typescriptFiles` controls the pattern used to identify a file as TypeScript when overriding rules.
- `resolveExtensions` lists all file extensions which should be recognised by `import/resolver`.
- `autoParseResolvableExtensions` enables empty `overrides` for all entries in `resolveExtensions`; this
  means matching files will be linted without needing to specify `--ext` on the CLI. If you do not want
  this behaviour, you can set it to `false` (all entries in `typescriptFiles` will continue to be linted
  automatically). Note that this feature only works with ESLint 7+.

## Automatic rule conversion

Several rules are automatically converted. If you believe another rule should be automatically converted, please
[raise an issue](https://github.com/davidje13/typescript-eslint-converter/issues).

All conversions only apply if an equivalent explicit configuration is not found.

### Global rule changes

* `react/jsx-filename-extension`
  - `extensions` will have `ts` and `tsx` added to mirror `js` and `jsx`.

* `import/no-extraneous-dependencies`
  - Any `devDependencies` glob patterns will be extended to include `.ts*` if they contain `.js*`.

* `import/extensions`
  - `.ts*` equivalents for all `.js*` extensions will be added.

### TypeScript file rule changes

These rule changes only apply to `.ts` and `.tsx` source files:

* Disable all rules [which are checked by the TypeScript compiler](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/src/configs/eslint-recommended.ts):
  - `getter-return`
  - `no-dupe-args`
  - `no-dupe-keys`
  - `no-unreachable`
  - `valid-typeof` &amp; `babel/valid-typeof`
  - `no-const-assign`
  - `no-new-symbol`
  - `no-this-before-super`
  - `no-undef`
  - `no-dupe-class-members`
  - `no-redeclare`

* Convert native eslint and babel rules which [do not support TypeScript](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#extension-rules):
  (any configuration is copied over; the TypeScript rules are config-compatible)

  - `brace-style` &rarr; `@typescript-eslint/brace-style`
  - `comma-spacing` &rarr; `@typescript-eslint/comma-spacing`
  - `default-param-last` &rarr; `@typescript-eslint/default-param-last`
  - `func-call-spacing` &rarr; `@typescript-eslint/func-call-spacing`
  - `no-array-constructor` &rarr; `@typescript-eslint/no-array-constructor`
  - `no-dupe-class-members` &rarr; `@typescript-eslint/no-dupe-class-members`
  - `no-empty-function` &rarr; `@typescript-eslint/no-empty-function`
  - `no-extra-parens` &rarr; `@typescript-eslint/no-extra-parens`
  - `no-extra-semi` &rarr; `@typescript-eslint/no-extra-semi`
  - `no-magic-numbers` &rarr; `@typescript-eslint/no-magic-numbers`
    - The TypeScript rule offers additional configuration options
  - `no-unused-expressions` &amp; `babel/no-unused-expressions` &rarr; `@typescript-eslint/no-unused-expressions`
  - `no-unused-vars` &rarr; `@typescript-eslint/no-unused-vars`
    - See [typescript-eslint#1856](https://github.com/typescript-eslint/typescript-eslint/issues/1856) for potential issues
  - `no-use-before-define` &rarr; `@typescript-eslint/no-use-before-define`
    - The TypeScript rule offers additional configuration options
    - See [typescript-eslint#1856](https://github.com/typescript-eslint/typescript-eslint/issues/1856) for potential issues
  - `no-useless-constructor` &rarr; `@typescript-eslint/no-useless-constructor`
  - `quotes` &amp; `babel/quotes` &rarr; `@typescript-eslint/quotes`
  - `require-await` &rarr; `@typescript-eslint/require-await`
  - `no-return-await` &rarr; `@typescript-eslint/return-await`
    - The TypeScript rule offers additional configuration options
    - The default `in-try-catch` matches `no-return-await`'s behaviour
  - `semi` &amp; `babel/semi` &rarr; `@typescript-eslint/semi`
  - `space-before-function-paren` &rarr; `@typescript-eslint/space-before-function-paren`

* `indent`
  - This rule is disabled by default due to [typescript-eslint#1824](https://github.com/typescript-eslint/typescript-eslint/issues/1824).
  - If you want to enable indentation linting, add an explicit `@typescript/indent` rule.
