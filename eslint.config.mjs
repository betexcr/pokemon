import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    files: ["src/**/*.{ts,tsx}", "functions/src/**/*.{ts,tsx}"], // Only lint TypeScript files in src and functions directories
    rules: {
      // Make warnings non-blocking for now
      "@typescript-eslint/no-unused-vars": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "react-hooks/exhaustive-deps": "off",
      "@next/next/no-img-element": "off",
      "@next/next/no-page-custom-font": "off",
      "react-hooks/rules-of-hooks": "error", // Keep critical errors
      "@typescript-eslint/ban-ts-comment": "off",
      "@typescript-eslint/no-require-imports": "off", // Allow require imports for now
      "@typescript-eslint/no-this-alias": "off", // Allow this aliasing
      "@typescript-eslint/no-unused-expressions": "off", // Allow unused expressions
      "prefer-const": "off", // Allow let declarations
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      "*.js", // Ignore all .js files in root (scripts, config files)
      "**/*.js", // Ignore all .js files everywhere
      "**/out/**", // Ignore out directory anywhere
      "**/build/**", // Ignore build directory anywhere
      "**/node_modules/**", // Ignore node_modules anywhere
      "**/playwright-report/**", // Ignore playwright reports
      "**/test-results/**", // Ignore test results
      "**/functions/lib/**", // Ignore compiled functions
      "**/functions/node_modules/**", // Ignore functions node_modules
      "test-*.js", // Ignore test files
      "**/test-*.js", // Ignore test files anywhere
      "**/*.js.map", // Ignore source maps
      "**/dist/**", // Ignore dist directories
      "**/coverage/**", // Ignore coverage directories
    ],
  },
];

export default eslintConfig;
