import js from "@eslint/js";

export default [
  {
    ...js.configs.recommended,
    languageOptions: {
      ...js.configs.recommended.languageOptions,
      ecmaVersion: 2022,
      sourceType: "module",
      globals: {
        ...js.configs.recommended.languageOptions?.globals,
        console: "readonly",
        process: "readonly",
        __dirname: "readonly",
        module: "readonly",
        require: "readonly"
      }
    }
  }
]; 