import type { ModuleOptions } from 'webpack';

export const rules: Required<ModuleOptions>['rules'] = [
  {
    test: /\.tsx?$/,
    exclude: /(node_modules|\.webpack)/,
    use: {
      loader: 'ts-loader',
      options: {
        transpileOnly: true,
      },
    },
  },
  {
    // Webpack copies imported pictures into the built application for us.
    test: /\.(png|jpe?g|webp)$/i,
    type: 'asset/resource',
  },
];
