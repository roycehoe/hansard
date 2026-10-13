/** @type {import("prettier").Config} */
module.exports = {
  printWidth: 80,
  trailingComma: 'es5',
  tabWidth: 2,
  semi: false,
  singleQuote: true,
  plugins: [
    require.resolve('prettier-plugin-organize-imports'),
    require.resolve('prettier-plugin-tailwindcss'),
  ],
  organizeImportsSkipDestructiveCodeActions: true,
}
