const yargs = require("yargs");
const path = require("path");
const env = yargs.argv.env;
const webpack = require("webpack");
const vueLoader = require("vue-loader");
const MonacoEditorPlugin = require("monaco-editor-webpack-plugin");
const HTMLWebpackPlugin = require("html-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

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
         path: require.resolve("path-browserify"),
         "perf_hooks": false
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
      new webpack.ContextReplacementPlugin(
         /(.+)?monaco-volar(.+)?/,
         resolve("./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar-plugins(\\|\/)css(.+)?/,
         path.resolve(__dirname, "./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar-plugins(\\|\/)html(.+)?/,
         path.resolve(__dirname, "./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?@volar(\\|\/)vue-language-core(.+)?/,
         path.resolve(__dirname, "./../src"),
         {}
      ),
      new webpack.ContextReplacementPlugin(
         /(.+)?typescript(\\|\/)lib(.+)?/,
         path.resolve(__dirname, "./../src"),
         {}
      ),
   ],
};

if (env == "dev") {
   config.mode = "development";
   config.watch = false;
   config.devtool = "inline-cheap-source-map";
   config.devServer = {
      historyApiFallback: true,
      port: process.env.PORT || 8080,
      hot: true,
      liveReload: false,
   };

   config.plugins.push(
      new HTMLWebpackPlugin({
         title: "JS Playground",
         favicon: resolve("./src/assets/logo_24x24.png"),
         templateContent: `<body>
   <div id="root" class="d-flex flex-column vh-100">
   </div>
</body>`,
         filename: "index.html",
      })
   );
} else {
   config.mode = "production";

   config.optimization = {
      minimize: true,
      minimizer: [
         new TerserPlugin({
            terserOptions: {
               compress: {
                  pure_funcs: [
                     "console.log",
                     "console.info",
                     "console.debug",
                  ],
               },
            },
         }),
      ],
   };
}

module.exports = config;
