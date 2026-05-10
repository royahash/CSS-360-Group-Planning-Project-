import js from "@eslint/js";
import globals from "globals";

export default [
  {
    files: ["src/js/**/*.js"],
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
    },
    rules: js.configs.recommended.rules,
  },
  {
    files: ["tests/**/*.js"],
    languageOptions: {
      globals: { ...globals.jest, ...globals.node },
    },
    rules: js.configs.recommended.rules,
  },
];
