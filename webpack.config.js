const path = require('path');
const { merge } = require('webpack-merge');
const CopyPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const CssMinimizerPlugin = require('css-minimizer-webpack-plugin');
const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');

const client = (module.exports = (env, argv) => {
  const config = {
    mode: argv.mode,
    devtool: argv.mode === 'development' ? 'inline-source-map' : undefined,

    module: {
      rules: [
        {
          test: /\.ts$/i,
          use: 'ts-loader',
        },
      ],
    },

    resolve: {
      extensions: ['.tsx', '.ts', '.js'],
      plugins: [new TsconfigPathsPlugin()],
    },
  };

  const client = {
    entry: {
      index: './client/index.ts',
    },

    output: {
      path: path.join(__dirname, './server/build/client'),
      filename: '[name].js',
      clean: true,
    },

    module: {
      rules: [
        {
          test: /\.s[ac]ss$/i,
          use: [MiniCssExtractPlugin.loader, 'css-loader', 'sass-loader'],
        },
      ],
    },

    optimization: {
      minimizer: ['...', new CssMinimizerPlugin()],
    },

    plugins: [new MiniCssExtractPlugin()],
  };

  const server = {
    entry: {
      index: './server/index.ts',
    },

    output: {
      path: path.join(__dirname, './server/build/server'),
      filename: '[name].js',
      clean: true,
    },

    target: 'node',

    externals({ request }, callback) {
      if (request.startsWith('.')) return callback();
      if (request.startsWith('@/')) return callback();
      return callback(null, `commonjs ${request}`);
    },

    plugins: [
      new CopyPlugin({
        patterns: [{ from: './views', to: path.join(__dirname, './server/build/views') }],
      }),
    ],
  };

  return [merge(config, client), merge(config, server)];
});
