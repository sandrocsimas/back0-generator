module.exports = {
  env: {
    node: true,
    jest: true,
  },
  extends: [
    'airbnb-base',
    'airbnb-typescript/base',
    'plugin:@typescript-eslint/strict-type-checked',
    'plugin:@typescript-eslint/stylistic-type-checked',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:deprecation/recommended',
    'plugin:prettier/recommended',
  ],
  ignorePatterns: ['.eslintrc.js', 'lib'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: true,
    tsconfigRootDir: __dirname,
  },
  plugins: ['@typescript-eslint'],
  root: true,
  rules: {
    '@typescript-eslint/class-methods-use-this': 'off',
    '@typescript-eslint/explicit-member-accessibility': 'error',
    '@typescript-eslint/explicit-function-return-type': 'error',
    '@typescript-eslint/no-empty-function': ['error', { allow: ['constructors'] }],
    '@typescript-eslint/prefer-readonly': 'error',
    'class-methods-use-this': 'off',
    'import/no-default-export': 'error',
    'import/order': [
      'error',
      {
        alphabetize: { caseInsensitive: false, order: 'asc' },
        'newlines-between': 'always',
      },
    ],
    'import/prefer-default-export': 'off',
    'no-empty-function': 'off',
    'sort-imports': ['error', { ignoreDeclarationSort: true }],
  },
  settings: {
    'import/resolver': { node: true, typescript: true },
  },
};
