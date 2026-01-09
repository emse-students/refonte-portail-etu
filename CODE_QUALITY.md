# Code Quality Setup

This project uses automated code quality tools to maintain consistent code style and catch errors before they reach production.

## Tools

- **ESLint**: Lints JavaScript, TypeScript, and Svelte files
- **Prettier**: Formats code automatically
- **Husky**: Manages Git hooks
- **lint-staged**: Runs linters on staged files before commit

## Available Scripts

### Formatting

```bash
# Check if files are formatted correctly
bun run format:check

# Auto-format all files
bun run format
```

### Linting

```bash
# Check for lint errors
bun run lint

# Auto-fix lint errors where possible
bun run lint:fix
```

### Type Checking

```bash
# Run TypeScript type checking
bun run tsc-check

# Run Svelte type checking
bun run check
```

## Pre-commit Hook

The project is configured with a pre-commit hook that automatically:

1. **Formats** staged files with Prettier
2. **Lints** staged files with ESLint (and auto-fixes issues)

This happens automatically when you run `git commit`. If there are any unfixable issues, the commit will be blocked until you fix them manually.

### What Gets Checked

- `*.{js,ts,svelte}` files: Prettier formatting + ESLint
- `*.{json,css,md}` files: Prettier formatting only

## Configuration Files

- `.prettierrc` - Prettier configuration
- `.prettierignore` - Files to ignore for Prettier
- `eslint.config.js` - ESLint configuration (flat config format)
- `.husky/pre-commit` - Pre-commit hook script
- `package.json` - Contains `lint-staged` configuration

## IDE Integration

### VS Code

Install these extensions for the best experience:

- [ESLint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode)
- [Svelte for VS Code](https://marketplace.visualstudio.com/items?itemName=svelte.svelte-vscode)

Add to your `.vscode/settings.json`:

```json
{
	"editor.defaultFormatter": "esbenp.prettier-vscode",
	"editor.formatOnSave": true,
	"editor.codeActionsOnSave": {
		"source.fixAll.eslint": "explicit"
	},
	"eslint.validate": ["javascript", "typescript", "svelte"]
}
```

## Troubleshooting

### Pre-commit hook not running

If the pre-commit hook doesn't run, try:

```bash
# Reinstall Husky
bun run prepare

# Make sure the hook is executable
chmod +x .husky/pre-commit
```

### Conflicts between Prettier and ESLint

The project uses `eslint-config-prettier` to disable ESLint rules that conflict with Prettier. If you encounter issues, verify that this package is installed and properly configured.

### Format a single file

```bash
# Format
bunx prettier --write path/to/file.ts

# Lint
bunx eslint --fix path/to/file.ts
```
