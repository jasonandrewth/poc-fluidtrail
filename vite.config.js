import glsl from "vite-plugin-glsl";
import { defineConfig } from "vite";
// import checker from "vite-plugin-checker";

export default defineConfig({
  plugins: [glsl()], // e.g. use TypeScript check
  resolve: { preserveSymlinks: true },
  //   assetsInclude: ["**/*.jpg", "**/*.glsl", "**/*.obj", "**/*.ply", "**/*.off"],
});
