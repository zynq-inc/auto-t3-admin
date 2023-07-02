import { defineConfig } from "tsup";
import CssModulesPlugin from "esbuild-css-modules-plugin";

export default defineConfig({
  esbuildPlugins: [CssModulesPlugin({ localsConvention: "dashes" })],
});
