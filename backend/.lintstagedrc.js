module.exports = {
  // Lint and format TypeScript files
  '**/*.{ts,tsx}': [
    'eslint --fix',
    'prettier --write',
  ],
  // Format other files
  '**/*.{json,md,yml,yaml}': [
    'prettier --write',
  ],
};

