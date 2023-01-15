const yargs = require("yargs");
const path = require("path");
const env = yargs.argv.env;
const webpack = require("webpack");
const vueLoader = require("vue-loader");
const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");

function resolve(source) {
   return path.resolve(__dirname, source);
}

const config = {
   entry: resolve("src/main.ts"),
   output: {
      path: resolve("dist"),
      filename: "[name].bundle.js",
      clean: true,
   },
   module: {
      rules: [
         {
            test: /\.ts$/,
            use: [
               {
                  loader: "ts-loader",
                  options: {
                     appendTsSuffixTo: [/\.vue$/],
                  },
               },
            ],
            exclude: /node_modules/,
         },
         {
            test: /\.vue$/,
            use: "vue-loader",
            exclude: /node_modules/,
         },
         {
            test: /\.(s(a|c)ss|css)$/,
            use: ["style-loader", "css-loader", "sass-loader"],
         },
      ],
   },
   resolve: {
      alias: {
         "@app": resolve("src"),
      },
   },
   plugins: [
      new webpack.DefinePlugin({
         __VUE_OPTIONS_API__: true,
         __VUE_PROD_DEVTOOLS__: false,
      }),
      new vueLoader.VueLoaderPlugin(),
      new MonacoEditorPlugin({
         languages: ["javascript", "css", "html", "typescript", "scss", "json"],
      }),
   ],
};

if (env == "dev") {
   config.mode = "development";
   config.watch = true;
   config.devtool = "inline-cheap-source-map";
} else {
   config.mode = "production";
}

module.exports = config;
