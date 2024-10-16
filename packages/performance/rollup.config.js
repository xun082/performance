import baseConfig from '../../config/rollup.config.mjs';

export default {
  ...baseConfig,
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/index.esm.js',
      format: 'esm',
    },
  ],
};
