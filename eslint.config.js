import prettier from "eslint-config-prettier";
import path from "node:path";
import js from "@eslint/js";
import svelte from "eslint-plugin-svelte";
import { defineConfig, includeIgnoreFile } from "eslint/config";
import globals from "globals";
import ts from "typescript-eslint";
import svelteConfig from "./svelte.config.js";

const gitignorePath = path.resolve(import.meta.dirname, ".gitignore");

export default defineConfig(
  includeIgnoreFile(gitignorePath),
  js.configs.recommended,
  // House standard (writing-ts): type-aware linting, not the non-type-checked
  // `recommended` preset. `projectService` resolves each file to its tsconfig
  // (src/** and the config .ts files are in the project; the handful of
  // out-of-project files — e2e/**, playwright.config.ts — fall to the default
  // inferred program), which is what powers rules like no-floating-promises.
  ts.configs.strictTypeChecked,
  ts.configs.stylisticTypeChecked,
  svelte.configs.recommended,
  prettier,
  svelte.configs.prettier,
  {
    languageOptions: {
      globals: { ...globals.browser, ...globals.node },
      parserOptions: {
        // e2e specs and playwright.config.ts live outside the app's tsconfig
        // (the SvelteKit-generated include is src/** + vite.config); allow them
        // onto the default inferred program so they're still type-aware-linted.
        projectService: {
          allowDefaultProject: ["playwright.config.ts", "e2e/*.ts"],
        },
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      // typescript-eslint strongly recommend that you do not use the no-undef lint rule on TypeScript projects.
      // see: https://typescript-eslint.io/troubleshooting/faqs/eslint/#i-get-errors-from-the-no-undef-rule-about-global-variables-not-being-defined-even-though-there-are-no-typescript-errors
      "no-undef": "off",
      // Interpolating a number (e.g. a port) into a string is safe and idiomatic;
      // re-enable it over strictTypeChecked's default of string-only.
      "@typescript-eslint/restrict-template-expressions": ["error", { allowNumber: true }],
      // Icons MUST be deep-imported (`phosphor-svelte/lib/<Icon>`): phosphor-svelte
      // ships no `sideEffects: false`, so a barrel import inlines its entire
      // ~3,000-icon set into the route chunk and wrecks LCP. The bundle-size budget
      // (check:bundle) is the catch-all; this stops the most likely cause at source.
      // Type-only imports erase, so they're allowed. See conventions:writing-svelte.
      "@typescript-eslint/no-restricted-imports": [
        "error",
        {
          paths: [
            {
              name: "phosphor-svelte",
              message:
                "Deep-import icons — `phosphor-svelte/lib/<Icon>` — so they tree-shake; the barrel inlines all ~3,000 icons. See conventions:writing-svelte.",
              allowTypeImports: true,
            },
          ],
        },
      ],
    },
  },
  {
    files: ["**/*.svelte", "**/*.svelte.ts", "**/*.svelte.js"],
    languageOptions: {
      parserOptions: {
        projectService: true,
        extraFileExtensions: [".svelte"],
        parser: ts.parser,
        svelteConfig,
      },
    },
  },
  {
    // The flat-config files themselves are plain ESM JS, not part of the app's
    // TS project; js.configs.recommended covers them, so turn the type-aware
    // rules back off rather than feed them through the default program.
    files: ["**/*.js"],
    extends: [ts.configs.disableTypeChecked],
  },
);
