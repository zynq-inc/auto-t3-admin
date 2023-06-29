import dts from "rollup-plugin-dts";
import typescript from "@rollup/plugin-typescript";
import esbuild from "rollup-plugin-esbuild";
import postcss from "rollup-plugin-postcss";

import packageJson from "./package.json" assert { type: "json" };
const name = packageJson.main.replace(/\.js$/, "");

const bundle = (config) => ({
  ...config,
  input: "src/index.ts",
  external: [
    /@prisma\/client/,
    /@trpc\/client/,
    /@trpc\/next/,
    /@trpc\/react-query/,
    /@trpc\/server/,
    /next/,
    /react/,
    /react-dom/,
  ],
});

export default [
  bundle({
    plugins: [
      typescript(),
      postcss({
        modules: true,
      }),
      esbuild(),
    ],
    output: [
      {
        file: `${name}.js`,
        format: "cjs",
        sourcemap: true,
      },
      {
        file: `${name}.mjs`,
        format: "es",
        sourcemap: true,
      },
    ],
  }),
  bundle({
    plugins: [dts()],
    output: {
      file: `${name}.d.ts`,
      format: "es",
    },
  }),
];
