import commonjs from '@rollup/plugin-commonjs';
import resolve from '@rollup/plugin-node-resolve';
import terser from '@rollup/plugin-terser';
import typescript from 'rollup-plugin-typescript2';
import del from 'rollup-plugin-delete';
import json from '@rollup/plugin-json';

const isProduction = process.env.NODE_ENV === 'production';

const baseConfig = {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.js',
      format: 'cjs',
    },
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
  plugins: [
    del({ targets: 'dist/*' }),
    resolve({
      extensions: ['.js', '.ts', '.json'],
    }),
    ,
    commonjs(),
    typescript(),
    isProduction &&
      terser({
        format: {
          comments: false,
        },
        compress: {
          drop_console: true,
        },
      }),

    json(),
  ],
};

export default baseConfig;
