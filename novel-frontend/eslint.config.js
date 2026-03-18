import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

import stylistic from '@stylistic/eslint-plugin';
import pluginVue from 'eslint-plugin-vue';

export default tseslint.config(
    {
        files: ['**/*.{ts,vue}'],
        extends: [
            eslint.configs.recommended,
            ...tseslint.configs.recommended,
            ...pluginVue.configs['flat/essential'],
        ],
        languageOptions: {
            ecmaVersion  : 'latest',
            sourceType   : 'module',
            parserOptions: {
                parser: tseslint.parser,
            },
        },
        rules: {
            '@typescript-eslint/no-explicit-any': 'off',
            'no-constant-condition': 'off',
        }
    },
    {
        plugins: {
            '@stylistic': stylistic
        },
        rules: {
            'vue/multi-word-component-names': 'off',
            '@stylistic/brace-style'        : ['error', 'stroustrup', { 'allowSingleLine': false }],
            '@stylistic/quotes'             : ['error', 'single'],
            '@stylistic/semi'               : ['error', 'always'],
            '@stylistic/indent'             : ['error', 4, { 'CallExpression': { 'arguments': 'first' }, 'VariableDeclarator': 'first' }],
        }
    }
);
