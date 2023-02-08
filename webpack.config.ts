/* eslint-env node */

import { Configuration as WebpackConfiguration } from 'webpack';
import { Configuration as WebpackDevServerConfiguration } from 'webpack-dev-server';
import * as path from 'path';
import { ConsoleRemotePlugin } from '@openshift-console/dynamic-plugin-sdk-webpack';
import CopyWebpackPlugin from 'copy-webpack-plugin';
import MonacoWebpackPlugin from 'monaco-editor-webpack-plugin';

interface Configuration extends WebpackConfiguration {
  devServer?: WebpackDevServerConfiguration;
}

const config: Configuration = {
  mode: 'development',
  // No regular entry points. The remote container entry is handled by ConsoleRemotePlugin.
  entry: {},
  context: path.resolve(__dirname, 'src'),
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name]-bundle.js',
    chunkFilename: '[name]-chunk.js',
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
  },
  module: {
    rules: [
      {
        test: /\.(jsx?|tsx?)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'ts-loader',
            options: {
              configFile: path.resolve(__dirname, 'tsconfig.json'),
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.scss$/,
        // exclude: /node_modules\/(?!(@patternfly|@console\/plugin-shared)\/).*/,
        use: [
          'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sourceMap: true,
              sassOptions: {
                outputStyle: 'compressed',
              },
            },
          },
        ],
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg|woff2?|ttf|eot|otf)(\?.*$|$)/,
        type: 'asset/resource',
        generator: {
          filename: 'assets/[name].[ext]',
        },
      },
      {
        test: /\.m?js/,
        resolve: {
          fullySpecified: false,
        },
      },
    ],
  },
  devServer: {
    static: './dist',
    port: 9001,
    // Allow bridge running in a container to connect to the plugin dev server.
    allowedHosts: 'all',
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'X-Requested-With, Content-Type, Authorization',
    },
    devMiddleware: {
      writeToDisk: true,
    },
  },
  plugins: [
    new ConsoleRemotePlugin(),
    new CopyWebpackPlugin({
      patterns: [{ from: path.resolve(__dirname, 'locales'), to: 'locales' }],
    }),
    new MonacoWebpackPlugin(),
  ],
  devtool: 'source-map',
  optimization: {
    chunkIds: 'named',
    minimize: false,
  },
};

if (process.env.NODE_ENV === 'production') {
  config.mode = 'production';
  config.output!.filename = '[name]-bundle-[hash].min.js';
  config.output!.chunkFilename = '[name]-chunk-[chunkhash].min.js';
  config.optimization!.chunkIds = 'deterministic';
  config.optimization!.minimize = true;
}

export default config;
