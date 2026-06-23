module.exports = {
  root: true,
  extends: [
    'expo',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint', 'unused-imports'],
  rules: {
    // Hide standard unused vars so the plugin can handle it better
    "no-unused-vars": "off",
    "@typescript-eslint/no-unused-vars": "off",
    
    // RED LINE for unused imports
    "unused-imports/no-unused-imports": "error",
    
    // YELLOW LINE (Warning) for unused variables
    "unused-imports/no-unused-vars": [
      "warn",
      { "vars": "all", "varsIgnorePattern": "^_", "args": "after-used", "argsIgnorePattern": "^_" }
    ],
  },
};