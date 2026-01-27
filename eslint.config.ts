import tsPlugin from '@typescript-eslint/eslint-plugin'
import tsParser from '@typescript-eslint/parser'
import skipFormatting from '@vue/eslint-config-prettier/skip-formatting'
import pluginCypress from 'eslint-plugin-cypress'
import pluginImport from 'eslint-plugin-import'
import sonarjs from 'eslint-plugin-sonarjs'
import pluginVitest from 'eslint-plugin-vitest'
import pluginVue from 'eslint-plugin-vue'
import pluginVueA11y from 'eslint-plugin-vuejs-accessibility'
import globals from 'globals'

export default [
  // Global ignores
  {
    ignores: [
      '**/*.d.ts',
      '**/.vite/',
      '**/coverage',
      '**/dist',
      '**/node_modules',
      '**/public',
      '**/.cache',
      '**/pnpm-lock.yaml',
      '**/.pnpm',
      '**/cypress/downloads',
      '**/cypress/screenshots',
      '**/cypress/videos',
      'scripts/**'
    ]
  },

  // ==========================================
  // STRICT RULES - Production TypeScript (.ts)
  // ==========================================
  {
    files: ['**/*.{ts,mts,tsx}'],
    ignores: ['**/*.{test,spec}.{ts,tsx}', '**/cypress/**'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: pluginImport,
      sonarjs: sonarjs
    },
    rules: {
      ...tsPlugin.configs.recommended.rules,
      ...sonarjs.configs.recommended.rules,
      // TypeScript strict rules
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'separate-type-imports' }
      ],
      '@typescript-eslint/explicit-function-return-type': 'off',
      '@typescript-eslint/explicit-module-boundary-types': 'off',
      '@typescript-eslint/naming-convention': [
        'error',
        {
          selector: 'typeLike',
          format: ['PascalCase']
        },
        {
          selector: 'interface',
          format: ['PascalCase'],
          custom: {
            regex: '^I[A-Z]',
            match: false
          }
        }
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Import organization (strict)
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@flashcards/**',
              group: 'internal'
            }
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          },
          'newlines-between': 'always'
        }
      ],
      // Code quality (strict)
      'array-callback-return': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
      'no-constructor-return': 'error',
      'no-debugger': 'error',
      'no-promise-executor-return': 'error',
      'prefer-const': 'error',
      'prefer-template': 'error',
      'require-atomic-updates': 'error',
      // SonarJS (strict)
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-nested-functions': ['error', { threshold: 4 }],
      'sonarjs/pseudo-random': 'off',
      'sonarjs/slow-regex': 'error',
      'sonarjs/todo-tag': 'warn'
    }
  },

  // ==========================================
  // STRICT RULES - Production Vue (.vue)
  // ==========================================
  // Apply base Vue configs first
  ...pluginVue.configs['flat/essential'],
  ...pluginVue.configs['flat/strongly-recommended'],
  ...pluginVue.configs['flat/recommended'],

  // Custom strict rules for production Vue files
  {
    files: ['**/*.vue'],
    languageOptions: {
      parserOptions: {
        ecmaVersion: 'latest',
        extraFileExtensions: ['.vue'],
        parser: tsParser,
        sourceType: 'module'
      },
      globals: {
        ...globals.browser
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: pluginImport,
      sonarjs: sonarjs,
      'vuejs-accessibility': pluginVueA11y
    },
    rules: {
      // TypeScript in Vue (strict) - must define plugin rules here since they're not in base Vue configs
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-non-null-assertion': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Import organization (strict)
      'import/first': 'error',
      'import/newline-after-import': 'error',
      'import/no-cycle': 'error',
      'import/no-duplicates': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'error',
      'import/order': [
        'error',
        {
          groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index'],
          pathGroups: [
            {
              pattern: '@flashcards/**',
              group: 'internal'
            }
          ],
          alphabetize: {
            order: 'asc',
            caseInsensitive: true
          },
          'newlines-between': 'always'
        }
      ],
      // SonarJS (strict)
      'sonarjs/cognitive-complexity': ['error', 15],
      'sonarjs/no-duplicate-string': ['error', { threshold: 3 }],
      'sonarjs/no-identical-functions': 'error',
      'sonarjs/no-nested-functions': ['error', { threshold: 4 }],
      'sonarjs/pseudo-random': 'off',
      'sonarjs/slow-regex': 'error',
      'sonarjs/todo-tag': 'warn',
      // Vue composition API (strict)
      'vue/block-lang': ['error', { script: { lang: 'ts' } }],
      'vue/block-order': ['error', { order: ['script', 'template', 'style'] }],
      'vue/component-api-style': ['error', ['script-setup']],
      'vue/component-name-in-template-casing': ['error', 'PascalCase'],
      'vue/component-options-name-casing': ['error', 'PascalCase'],
      'vue/custom-event-name-casing': ['error', 'camelCase'],
      'vue/define-emits-declaration': ['error', 'type-based'],
      'vue/define-macros-order': [
        'error',
        {
          order: ['defineOptions', 'defineProps', 'defineEmits', 'defineSlots']
        }
      ],
      'vue/define-props-declaration': ['error', 'type-based'],
      'vue/html-self-closing': [
        'error',
        {
          html: {
            void: 'always',
            normal: 'always',
            component: 'always'
          },
          svg: 'always',
          math: 'always'
        }
      ],
      'vue/multi-word-component-names': [
        'error',
        {
          ignores: ['default', 'index', 'App']
        }
      ],
      'vue/no-duplicate-attr-inheritance': 'error',
      'vue/no-empty-component-block': 'error',
      'vue/no-ref-object-reactivity-loss': 'error',
      'vue/no-required-prop-with-default': 'error',
      'vue/no-setup-props-reactivity-loss': 'error',
      'vue/no-template-target-blank': 'error',
      'vue/no-this-in-before-route-enter': 'error',
      'vue/no-undef-components': [
        'error',
        {
          ignorePatterns: ['^q-', '^router-']
        }
      ],
      'vue/no-undef-properties': 'error',
      'vue/no-unused-refs': 'error',
      'vue/no-unused-vars': 'error',
      'vue/no-useless-mustaches': 'error',
      'vue/no-useless-template-attributes': 'error',
      'vue/no-useless-v-bind': 'error',
      'vue/no-v-html': 'error',
      'vue/no-v-text-v-html-on-component': 'error',
      'vue/padding-line-between-blocks': 'error',
      'vue/prefer-define-options': 'error',
      'vue/prefer-separate-static-class': 'error',
      'vue/prefer-true-attribute-shorthand': 'error',
      'vue/require-default-prop': 'error',
      'vue/require-macro-variable-name': [
        'error',
        {
          defineProps: 'props',
          defineEmits: 'emit',
          defineSlots: 'slots',
          useSlots: 'slots',
          useAttrs: 'attrs'
        }
      ],
      'vue/require-typed-ref': 'error',
      'vue/v-for-delimiter-style': ['error', 'in'],
      'vue/v-on-event-hyphenation': ['error', 'always', { autofix: true }],
      'vue/valid-define-options': 'error',
      // Accessibility (strict)
      ...pluginVueA11y.configs.recommended.rules,
      'vuejs-accessibility/no-autofocus': 'warn'
    }
  },

  // Generated TypeScript files - relax rules
  {
    files: [
      '**/auto-imports.d.ts',
      '**/components.d.ts',
      '**/env.d.ts',
      '**/typed-router.d.ts',
      'vite.config.d.ts',
      'vitest.config.d.ts'
    ],
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/consistent-type-imports': 'off',
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': 'off'
    }
  },

  // Config files
  {
    files: ['*.config.{js,ts,mjs,mts}', 'vite.config.*', 'vitest.config.*'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      'no-console': 'off'
    }
  },

  // ==========================================
  // RELAXED RULES - Unit Tests (spec.ts)
  // ==========================================
  {
    files: ['**/*.{test,spec}.{js,ts,jsx,tsx}', '**/__tests__/setup.ts'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.node,
        // Add Vitest globals if using globals: true in vitest.config
        afterAll: 'readonly',
        afterEach: 'readonly',
        beforeAll: 'readonly',
        beforeEach: 'readonly',
        describe: 'readonly',
        expect: 'readonly',
        it: 'readonly',
        suite: 'readonly',
        test: 'readonly',
        vi: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: pluginImport,
      vitest: pluginVitest
    },
    rules: {
      ...pluginVitest.configs.recommended.rules,
      // Relaxed TypeScript rules for tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }
      ],
      // Relaxed import rules for tests
      'import/newline-after-import': 'off',
      'import/no-cycle': 'off',
      'import/order': 'off',
      // Relaxed code quality for tests
      'no-console': 'off',
      'prefer-template': 'off',
      // Relaxed SonarJS for tests
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/todo-tag': 'off',
      // Vitest-specific rules
      'vitest/consistent-test-it': ['error', { fn: 'it', withinDescribe: 'it' }],
      'vitest/expect-expect': 'warn',
      'vitest/no-disabled-tests': 'warn',
      'vitest/no-focused-tests': 'error',
      'vitest/prefer-to-be': 'error',
      'vitest/prefer-to-have-length': 'error',
      'vitest/valid-expect': 'error'
    }
  },

  // ==========================================
  // MOST RELAXED RULES - E2E Tests (cypress/)
  // ==========================================
  {
    files: [
      '**/cypress/e2e/**/*.{cy,spec}.{js,ts,jsx,tsx}',
      '**/cypress/support/**/*.{js,ts,jsx,tsx}'
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: 'latest',
        sourceType: 'module'
      },
      globals: {
        ...globals.browser,
        cy: 'readonly',
        Cypress: 'readonly'
      }
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
      import: pluginImport,
      cypress: pluginCypress
    },
    rules: {
      ...pluginCypress.configs.recommended.rules,
      // Relaxed TypeScript rules for E2E tests
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-non-null-assertion': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      '@typescript-eslint/prefer-nullish-coalescing': 'off',
      '@typescript-eslint/prefer-optional-chain': 'off',
      // Relaxed import rules for E2E tests
      'import/first': 'off',
      'import/newline-after-import': 'off',
      'import/no-cycle': 'off',
      'import/no-duplicates': 'off',
      'import/order': 'off',
      // Relaxed code quality for E2E tests
      'array-callback-return': 'off',
      'no-console': 'off',
      'no-debugger': 'off',
      'no-unused-expressions': 'off',
      'prefer-const': 'off',
      'prefer-template': 'off',
      // Relaxed SonarJS for E2E tests (all off)
      'sonarjs/cognitive-complexity': 'off',
      'sonarjs/no-duplicate-string': 'off',
      'sonarjs/no-identical-functions': 'off',
      'sonarjs/no-nested-functions': 'off',
      'sonarjs/slow-regex': 'off',
      'sonarjs/todo-tag': 'off'
    }
  },

  // Apply skip formatting last (removes conflicting formatting rules)
  skipFormatting
]
