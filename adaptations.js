function copyObjJsToTs(conf) {
  if (typeof conf !== 'object' || !conf || (!conf.js && !conf.jsx)) {
    return conf;
  }
  return { ts: conf.js, tsx: conf.jsx, ...conf };
}

function copyListJsToTs(list) {
  if (!Array.isArray(list)) {
    return list;
  }
  const converted = list
    .map((v) => v.startsWith('js') ? 'ts' + v.substr(2) : v.startsWith('.js') ? '.ts' + v.substr(3) : '')
    .filter((v) => v && !list.includes(v));
  return [...list, ...converted];
}

function copyGlobListJsToTs(list) {
  if (!Array.isArray(list)) {
    return list;
  }
  return list.map((v) => v
    .replace(/(?<=[{,])(\.?)js([^,}]*)(?=[,}])/g, '$1js$2,$1ts$2')
    .replace(/(?<=[^{,])\.js([^{},]*)$/, '.{js$1,ts$1}')
  );
}

function applyKeys(o, keys, fn) {
  const check = Array.isArray(keys) ? ((x) => keys.includes(x)) : keys;
  const r = {};
  Object.keys(o).forEach((k) => {
    if (check(k)) {
      r[k] = fn(o[k]);
    } else {
      r[k] = o[k];
    }
  });
  return r;
}

const BASE_RULES = {
  'react/jsx-filename-extension': ([mode, opts = {}]) => ([mode, {
    ...opts,
    extensions: copyListJsToTs(opts.extensions),
  }]),
  'import/no-extraneous-dependencies': ([mode, opts = {}]) => ([
    mode,
    applyKeys(opts, (k) => k.endsWith('Dependencies'), copyGlobListJsToTs),
  ]),
  'import/extensions': (config) => config.map(copyObjJsToTs),
};

const getTypescriptRules = ({ indent }) => ({
  'getter-return': ['off'],
  'no-dupe-args': ['off'],
  'no-dupe-keys': ['off'],
  'no-unreachable': ['off'],
  'valid-typeof': ['off'],
  'babel/valid-typeof': ['off'],
  'no-const-assign': ['off'],
  'no-new-symbol': ['off'],
  'no-this-before-super': ['off'],
  'no-undef': ['off'],
  'no-dupe-class-members': ['off'],
  'no-redeclare': ['off'],

  'brace-style': '@typescript-eslint/brace-style',
  'comma-spacing': '@typescript-eslint/comma-spacing',
  'default-param-last': '@typescript-eslint/default-param-last',
  'dot-notation': '@typescript-eslint/dot-notation',
  'func-call-spacing': '@typescript-eslint/func-call-spacing',
  'indent': indent ? '@typescript-eslint/indent' : ['off'], // require explicit opt-in due to https://github.com/typescript-eslint/typescript-eslint/issues/1824
  'init-declarations': '@typescript-eslint/init-declarations',
  'keyword-spacing': '@typescript-eslint/keyword-spacing',
  'lines-between-class-members': '@typescript-eslint/lines-between-class-members',
  'no-array-constructor': '@typescript-eslint/no-array-constructor',
  'no-dupe-class-members': '@typescript-eslint/no-dupe-class-members',
  'no-empty-function': '@typescript-eslint/no-empty-function',
  'no-extra-parens': '@typescript-eslint/no-extra-parens',
  'no-extra-semi': '@typescript-eslint/no-extra-semi',
  'no-invalid-this': '@typescript-eslint/',
  'no-loop-func': '@typescript-eslint/no-loop-func',
  'no-loss-of-precision': '@typescript-eslint/',
  'no-magic-numbers': '@typescript-eslint/no-magic-numbers',
  'no-redeclare': '@typescript-eslint/no-redeclare',
  'no-shadow': '@typescript-eslint/no-shadow',
  'no-unused-expressions': '@typescript-eslint/no-unused-expressions',
  'babel/no-unused-expressions': '@typescript-eslint/no-unused-expressions',
  'no-unused-vars': '@typescript-eslint/no-unused-vars',
  'no-use-before-define': '@typescript-eslint/no-use-before-define',
  'no-useless-constructor': '@typescript-eslint/no-useless-constructor',
  'quotes': '@typescript-eslint/quotes',
  'babel/quotes': '@typescript-eslint/quotes',
  'require-await': '@typescript-eslint/require-await',
  'no-return-await': '@typescript-eslint/return-await',
  'semi': '@typescript-eslint/semi',
  'babel/semi': '@typescript-eslint/semi',
  'space-before-function-paren': '@typescript-eslint/space-before-function-paren',
});

module.exports = {
  BASE_RULES,
  getTypescriptRules,
};
