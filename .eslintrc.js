const jsRules = {
	files: '*.js',
	parserOptions: {
		ecmaVersion: '2017',
		sourceType: 'module',
	},
	rules: {
		strict: ['error', 'global'],
	},
};

const tsRules = {
	files: ['*.ts'],
	extends: [
		'plugin:@typescript-eslint/eslint-recommended',
		'plugin:@typescript-eslint/recommended',
		'plugin:@typescript-eslint/recommended-requiring-type-checking',
	],
	parser: '@typescript-eslint/parser',
	parserOptions: {
		project: 'tsconfig.json',
		tsconfigRootDir: '.',
	},
	plugins: ['@typescript-eslint'],
	rules: {
		'@typescript-eslint/ban-ts-comment': 'warn',
		'tsdoc/syntax': 'warn',
	},
};

const vueRules = {
	files: '*.vue',
	extends: ['plugin:vue/essential'],
};

const baseRules = {
	env: {
		es6: true,
		node: true,
	},
	extends: ['eslint:recommended'],
	plugins: ['eslint-plugin-tsdoc'],
	rules: {
		/*
		 * Possible errors
		 */

		// Enforce "for" loop update clause moving the counter
		// in the right direction
		'for-direction': 'error',

		// Allow unnecessary parentheses
		'no-extra-parens': 'off',

		// Disallow template literal placeholder syntax in regular string
		'no-template-curly-in-string': 'error',

		/*
		 * Best practices
		 */

		// Enforce consistent brace style for all control statements
		curly: 'error',

		// Require the use of === and !==
		eqeqeq: 'error',

		// Disallow `else` blocks after `return` statements in `if` statements
		'no-else-return': 'error',

		// Disallow empty functions
		'no-empty-function': 'error',

		// Disallow function declarations and expressions inside loop statements
		'no-loop-func': 'error',

		// Disallow new operators with the String, Number, and Boolean objects
		'no-new-wrappers': 'error',

		// Disallow reassigning function parameters
		'no-param-reassign': 'error',

		// Disallow unnecessary concatenation of strings
		'no-useless-concat': 'error',

		// Disallow redundant return statements
		'no-useless-return': 'error',

		/*
		 * Stylistic issues
		 */

		// Require 'one true brace style', in which the opening brace
		// of a block is placed on the same line as its corresponding
		// statement or declaration
		'brace-style': ['error', '1tbs'],

		// Disallow spaces inside of brackets
		'array-bracket-spacing': ['error', 'never'],

		// Require CamelCase
		camelcase: ['error', { properties: 'never' }],

		// Require or disallow trailing commas
		'comma-dangle': [
			'error',
			{
				arrays: 'always-multiline',
				objects: 'always-multiline',
				imports: 'always-multiline',
				exports: 'never',
				functions: 'never',
			},
		],

		// Require space after comma
		'comma-spacing': ['error', { after: true }],

		// Require newline at the end of files
		'eol-last': ['error', 'always'],

		// Disallow spacing between function identifiers and their invocations
		'func-call-spacing': 'error',

		// Use tabs as indentation
		// Enforce indentation level for case clauses in switch statements
		indent: ['error', 'tab', { SwitchCase: 1 }],

		// Require space after colon in object literal properties
		'key-spacing': ['error', { afterColon: true }],

		// Require space before and after keywords
		'keyword-spacing': 'error',

		// Require Unix line endings
		'linebreak-style': ['error', 'unix'],

		// Disallow empty block statements
		'no-empty': ['error', { allowEmptyCatch: true }],

		// Disallow `if` statements as the only statement in `else` blocks
		'no-lonely-if': 'error',

		// Disallow multiple spaces
		'no-multi-spaces': 'error',

		// Disallow nested ternary expressions
		'no-nested-ternary': 'error',

		// Disallow trailing whitespace at the end of lines
		'no-trailing-spaces': 'error',

		// Disallow ternary operators when simpler alternatives exist
		'no-unneeded-ternary': 'error',

		// Disallow whitespace before properties
		'no-whitespace-before-property': 'error',

		'one-var': ['error', 'never'],

		// Require spaces inside curly braces
		'object-curly-spacing': ['error', 'always'],

		// Require single quotes
		quotes: [
			'error',
			'single',
			{
				avoidEscape: true,
			},
		],

		// Require space before blocks
		'space-before-blocks': ['error', 'always'],

		// Disallow a space before function parenthesis
		'space-before-function-paren': [
			'error',
			{
				named: 'never',
				anonymous: 'never',
				asyncArrow: 'always',
			},
		],

		// Disallow spaces inside of parentheses
		'space-in-parens': 'error',

		// Require spacing around infix operators
		'space-infix-ops': 'error',

		// Enforce consistent spacing after the // or /* in a comment
		'spaced-comment': 'error',

		// Require semicolon at the end of statement
		semi: ['error', 'always'],

		// Enforce spacing around colons of switch statements
		'switch-colon-spacing': ['error', { after: true, before: false }],

		/*
		 * ECMAScript 6
		 */

		// Require parentheses around arrow function arguments
		'arrow-parens': 'error',
		'arrow-spacing': 'error',

		// Require let or const instead of var
		'no-var': 'error',

		// Require method and property shorthand syntax for object literals
		'object-shorthand': ['error', 'always'],

		// Require `const` declarations for variables
		// that are never reassigned after declared
		'prefer-const': ['error', { destructuring: 'all' }],

		// Require template literals instead of string concatenation
		'prefer-template': 'error',

		// Disallow spacing around embedded expressions of template strings
		'template-curly-spacing': 'error',
	},
};

module.exports = {
	...baseRules,
	overrides: [jsRules, tsRules, vueRules],
};
