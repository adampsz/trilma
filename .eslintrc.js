module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "tsconfig.json",
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier",
  ],

  rules: {
    eqeqeq: ["warn", "always"],
    "@typescript-eslint/no-unused-vars": ["warn", { argsIgnorePattern: "^_" }],
  },

  overrides: [
    {
      files: ["*.{ts,tsx}"],
      extends: [
        "plugin:@typescript-eslint/recommended-requiring-type-checking",
      ],
    },
    {
      files: ["./server", ".eslintrc.js", "webpack.config.js"],
      env: { node: true },
    },
    {
      files: [".eslintrs.js", "webpack.config.js"],
      rules: {
        "@typescript-eslint/no-var-requires": 0,
      },
    },
  ],
};
