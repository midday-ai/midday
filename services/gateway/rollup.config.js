import typescript from '@rollup/plugin-typescript';
import terser from '@rollup/plugin-terser';
import json from '@rollup/plugin-json';

export default {
  input: 'src/start-server.ts',
  output: {
    dir: 'build',
    format: 'es',
  },
  plugins: [
    typescript({ exclude: ['**/*.test.ts', 'start-test.js'] }),
    terser(),
    json(),
  ],
};
