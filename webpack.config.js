const path = require("path");
const glob = require("glob");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const TerserPlugin = require("terser-webpack-plugin");
const MonacoWebpackPlugin = require("monaco-editor-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = {
  entry: {
    index: glob.sync("./src/**/*.js"),
  },
  target: "web",
  module: {
    rules: [
      {
        test: /\.(png|svg|jpg|jpeg|gif|json)$/i,
        type: "asset/resource",
      },
      {
        test: /\.css$/i,
        use: ["style-loader", "css-loader"],
      },
      {
        test: /\.scss$/,
        use: [
          MiniCssExtractPlugin.loader,
          "css-loader",
          {
            loader: "sass-loader",
            options: {
              api: "modern",
              sassOptions: {
                includePaths: [path.resolve(__dirname, "node_modules/@syncfusion")]
              },
            },
          },
        ],
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: "index.html",
      favicon: "favicon.ico",
    }),
    new MiniCssExtractPlugin({
      filename: "[name].css",
    }),
    new MonacoWebpackPlugin({
      languages: ["json", "xml"],
    }),
    new CopyWebpackPlugin({
      patterns: [
        {
          from: path.resolve(__dirname, "public/assets"),
          to: path.resolve(__dirname, "dist/assets"),
        },
      ],
    }),
  ],
  resolve: {
    extensions: [".js"],
  },
  output: {
    filename: "[name].js",
    path: path.resolve(__dirname, "dist"),
  },
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        extractComments: false,
      }),
    ],
  },
};