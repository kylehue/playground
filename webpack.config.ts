import yargs from "yargs";
import webpack from "webpack";
import "webpack-dev-server";
import { VueLoaderPlugin } from "vue-loader";
import MonacoEditorPlugin from "monaco-editor-webpack-plugin";
import HTMLWebpackPlugin from "html-webpack-plugin";
import TerserPlugin from "terser-webpack-plugin";
import path from "path";
import * as url from "url";
const __dirname = url.fileURLToPath(new URL(".", import.meta.url));

function resolve(source) {
   return path.resolve(__dirname, source);
}

const env = yargs(process.argv).argv.env;
const config: webpack.Configuration = {
   entry: [resolve("src/main.ts")],
   output: {
      path: resolve("dist"),
      filename: "[name].bundle.js",
      clean: true,
      publicPath: "/",
   },
   watch: false,
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
         {
            test: /\.(png|wasm)$/,
            type: "asset/resource",
         },
      ],
   },
   resolve: {
      alias: {
         "@app": resolve("src"),
         "monaco-editor-core": "monaco-editor",
      },
      extensions: [".ts", ".js", ".json"],
      fallback: {
         path: "path-browserify",
         perf_hooks: false
      },
   },
   plugins: [
      new webpack.DefinePlugin({
         __VUE_OPTIONS_API__: true,
         __VUE_PROD_DEVTOOLS__: false,
      }),
      new VueLoaderPlugin(),
      new MonacoEditorPlugin({
         languages: ["javascript", "css", "html", "typescript", "scss", "json"],
      }),
      new webpack.ContextReplacementPlugin(
         /(.+)?monaco-volar(.+)?/,
         resolve("./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar-plugins(\\|\/)css(.+)?/,
         resolve("./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar-plugins(\\|\/)html(.+)?/,
         resolve("./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar(\\|\/)vue-language-core(.+)?/,
         resolve("./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?typescript(\\|\/)lib(.+)?/,
         resolve("./../src"),
         {}
      ),
      new HTMLWebpackPlugin({
         title: "JS Playground",
         favicon: resolve("./src/assets/logo_24x24.png"),
         template: resolve("./index.html"),
         filename: "index.html",
      }),
   ],
};

if (env == "dev") {
   config.mode = "development";
   config.devtool = "inline-cheap-source-map";
   config.devServer = {
      historyApiFallback: true,
      port: process.env.PORT || 8080,
      hot: true,
      liveReload: false,
   } as webpack.Configuration["devServer"];
} else {
   config.mode = "production";

   config.optimization = {
      minimize: true,
      minimizer: [
         new TerserPlugin({
            terserOptions: {
               compress: {
                  pure_funcs: ["console.log", "console.info", "console.debug"],
               },
            },
         }),
      ],
   };
}

export default config;
