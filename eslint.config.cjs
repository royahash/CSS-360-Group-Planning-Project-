module.exports = [
  {
    files: ["src/js/**/*.js", "tests/**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        window: "readonly",
        document: "readonly",
        console: "readonly",
        // Add other globals as needed
      },
    },
    rules: {
      // Add custom rules here
    },
  },
];