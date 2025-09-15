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
    ],
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
    },
  },
];

export default eslintConfig;
