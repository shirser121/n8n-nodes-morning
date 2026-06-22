module.exports = {
	root: true,
	env: {
		es2021: true,
		node: true,
	},
	parser: '@typescript-eslint/parser',
	parserOptions: {
		ecmaVersion: 2021,
		sourceType: 'module',
	},
	plugins: ['@typescript-eslint'],
	extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended'],
	ignorePatterns: ['dist/**', 'node_modules/**', '*.js'],
	rules: {
		// The n8n property catalogs lean on `any` for request/response shapes.
		'@typescript-eslint/no-explicit-any': 'off',
		'@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
	},
	// To chase n8n's *verified* community-node badge later, add
	// eslint-plugin-n8n-nodes-base and extend plugin:n8n-nodes-base/nodes
	// + /credentials here. That ruleset is the verification style guide.
};
