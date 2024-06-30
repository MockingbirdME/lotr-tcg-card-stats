module.exports = {
  env: {
    es2021: true,
    node: true
  },
  extends: [
    'eslint:recommended',
    'plugin:mocha/recommended'
  ],
  overrides: [
    {
      env: {
        node: true
      },
      files: [
        '.eslintrc.{js,cjs}'
      ],
      parserOptions: {
        sourceType: 'script'
      }
    }
  ],
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  plugins: [ 'mocha', '@stylistic/js' ],
  rules: {
    // Stylistic rules
    "@stylistic/js/comma-dangle": [ "error", "never" ],
    "@stylistic/js/array-bracket-spacing": [ "error", "always" ],
    "@stylistic/js/no-trailing-spaces": "error",
    "@stylistic/js/object-curly-spacing": [ "error", "always" ],
    "@stylistic/js/semi": "error",

    // Mocha specific rules
    "mocha/no-exports": "off",

    // Express required rules
    "no-unused-vars": [ "error", { "argsIgnorePattern": "next" } ]
  }
};
