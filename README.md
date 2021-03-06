# TypeScript ESLint Converter

Automatic ESLint rule conversions for TypeScript.

ESLint [replaces TSLint](https://eslint.org/blog/2019/01/future-typescript-eslint) for linting TypeScript.

Existing JavaScript rules will be converted to support TypeScript, so you can combine this with base
configurations such as airbnb easily. See below for full details.

## Installation

This assumes you have already installed and configured ESLint.

```bash
npm install --save-dev typescript-eslint-converter
```

Change your `.eslintrc.js`:

```javascript
const typescriptEslintConverter = require('typescript-eslint-converter');

module.exports = typescriptEslintConverter({
  // existing configuration here; for example airbnb:
  extends: ['airbnb'],
});
```

This project is not limited to airbnb! You can use any ESLint configuration, and it will be converted
to be TypeScript-compatible (see below for full details).

Note that by default, `indent` is _not_ converted to `@typescript-eslint/indent` (due to
[typescript-eslint#1824](https://github.com/typescript-eslint/typescript-eslint/issues/1824)).
If you want to enable indentation linting despite the known issues, you can:

```javascript
const typescriptEslintConverter = require('typescript-eslint-converter');

module.exports = typescriptEslintConverter({
  // existing configuration here
}, {
  indent: true, // enable indent -> @typescript-eslint/indent conversion
});
```

## Customisation

### Adding or customising TypeScript-specific rules

The recommended way to add or customise TypeScript rules is with an `override`. This prevents
ESLint attempting to apply the rules to Javascript files:

```javascript
const typescriptEslintConverter = require('typescript-eslint-converter');

module.exports = typescriptEslintConverter({
  extends: ['airbnb'], /* or whatever you are using */

  overrides: [
    {
      files: ['*.ts', '*.tsx'],
      rules: {
        // examples:

        // use airbnb quote rules for JS, but backticks for TS:
        '@typescript-eslint/quotes': ['error', 'backtick'],

        // TS-specific rule: enforce Array<T> rather than T[]
        '@typescript-eslint/array-type': ['error', 'generic'],
      },
    }
  ],
});
```

### Options

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
  useLoaderStyle: null,
  recommended: true,
  indent: false,
});
```

- `typescriptFiles` controls the pattern used to identify a file as TypeScript when overriding rules.
- `resolveExtensions` lists all file extensions which should be recognised by `import/resolver`.
- `autoParseResolvableExtensions` enables empty `overrides` for all entries in `resolveExtensions`; this
  means matching files will be linted without needing to specify `--ext` on the CLI. If you do not want
  this behaviour, you can set it to `false` (all entries in `typescriptFiles` will continue to be linted
  automatically). Note that this feature only works with ESLint 7+.
- `useLoaderStyle` if `true`, forces `baseConfig`-style configuration (used by the `CLIEngine` API and
  `eslint-loader`). If `false`, forces flat behaviour (matching `.eslintrc` files). By default, this
  will automatically detect the presence of `baseConfig` in the input configuration. When using inside
  a `.eslintrc` file, you should not need to change this. If using in a wrapper project (such as
  `neutrino`), you may need to set this to `true` to guarantee correct behaviour.
- `recommended` adds `'plugin:@typescript-eslint/recommended'` to the `extends` option.
  If you do not want this, set it to `false`.
- `indent` converts any existing `indent` rule to `@typescript-eslint/indent`. This is disabled by
  default due to known issues with `@typescript-eslint/indent`.

## Automatic rule conversion

Several rules are automatically converted. If you believe another rule should be automatically converted, please
[raise an issue](https://github.com/davidje13/typescript-eslint-converter/issues).

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

* Convert native ESLint and babel rules which [do not support TypeScript](https://github.com/typescript-eslint/typescript-eslint/tree/master/packages/eslint-plugin#extension-rules):
  (any configuration is copied over; the TypeScript rules are config-compatible)

  - `brace-style` &rarr; `@typescript-eslint/brace-style`
  - `comma-spacing` &rarr; `@typescript-eslint/comma-spacing`
  - `default-param-last` &rarr; `@typescript-eslint/default-param-last`
  - `dot-notation` &rarr; `@typescript-eslint/dot-notation`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/dot-notation.md)
  - `func-call-spacing` &rarr; `@typescript-eslint/func-call-spacing`
  - `init-declarations` &rarr; `@typescript-eslint/init-declarations`
  - `keyword-spacing` &rarr; `@typescript-eslint/keyword-spacing`
  - `lines-between-class-members` &rarr; `@typescript-eslint/lines-between-class-members`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/lines-between-class-members.md)
  - `no-array-constructor` &rarr; `@typescript-eslint/no-array-constructor`
  - `no-dupe-class-members` &rarr; `@typescript-eslint/no-dupe-class-members`
  - `no-empty-function` &rarr; `@typescript-eslint/no-empty-function`
  - `no-extra-parens` &rarr; `@typescript-eslint/no-extra-parens`
  - `no-extra-semi` &rarr; `@typescript-eslint/no-extra-semi`
  - `no-invalid-this` &amp; `babel/no-invalid-this` &rarr; `@typescript-eslint/no-invalid-this`
  - `no-loop-func` &rarr; `@typescript-eslint/no-loop-func`
  - `no-loss-of-precision` &rarr; `@typescript-eslint/no-loss-of-precision`
  - `no-magic-numbers` &rarr; `@typescript-eslint/no-magic-numbers`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-magic-numbers.md)
  - `no-redeclare` &rarr; `@typescript-eslint/no-redeclare`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-redeclare.md)
  - `no-shadow` &rarr; `@typescript-eslint/no-shadow`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-shadow.md)
  - `no-unused-expressions` &amp; `babel/no-unused-expressions` &rarr; `@typescript-eslint/no-unused-expressions`
  - `no-unused-vars` &rarr; `@typescript-eslint/no-unused-vars`
  - `no-use-before-define` &rarr; `@typescript-eslint/no-use-before-define`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/no-use-before-define.md)
  - `no-useless-constructor` &rarr; `@typescript-eslint/no-useless-constructor`
  - `quotes` &amp; `babel/quotes` &rarr; `@typescript-eslint/quotes`
  - `require-await` &rarr; `@typescript-eslint/require-await`
  - `no-return-await` &rarr; `@typescript-eslint/return-await`
    - The TypeScript rule offers [additional configuration options](https://github.com/typescript-eslint/typescript-eslint/blob/master/packages/eslint-plugin/docs/rules/return-await.md)
    - The default `in-try-catch` matches `no-return-await`'s behaviour
  - `semi` &amp; `babel/semi` &rarr; `@typescript-eslint/semi`
  - `space-before-function-paren` &rarr; `@typescript-eslint/space-before-function-paren`

* `indent`
  - This rule is disabled by default due to [typescript-eslint#1824](https://github.com/typescript-eslint/typescript-eslint/issues/1824).
  - If you want to enable indentation linting, use the `indent` option (described above).
