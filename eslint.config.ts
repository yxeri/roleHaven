import eslint from '@eslint/js';
import tslint from 'typescript-eslint';

export default tslint.config(
  {
    extends: [
      eslint.configs.recommended,
      ...tslint.configs.recommended,
    ],
    ignores: ['**/*.js'],
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { 'vars': 'all', 'args': 'all', 'ignoreRestSiblings': true }]
    }
  }
);
