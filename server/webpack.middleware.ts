import webpack from "webpack";
import webpackConfig from "../webpack.config";
import webpackDevMiddleware from "webpack-dev-middleware";
import webpackHotMiddleware from "webpack-hot-middleware";

export default function (app) {
   (webpackConfig.entry as string[])?.unshift(
      "webpack-hot-middleware/client?reload=true&timeout=1000"
   );
   webpackConfig.plugins?.push(new webpack.HotModuleReplacementPlugin());
   
   //@ts-ignore
   const webpackCompiler = webpack(webpackConfig);
   app.use(
      webpackDevMiddleware(webpackCompiler, {
         publicPath: webpackConfig.output?.publicPath,
      })
   );
   app.use(webpackHotMiddleware(webpackCompiler));
}
