import Toypack from "toypack";

const bundler = new Toypack({
   bundleOptions: {},
});

onmessage = async event => {
   const data = event.data;

   if (data.cmd) {
      const result = await bundler[data.cmd](...data.args);

      postMessage({
         ...data,
         result: data.cmd == "bundle" ? result : {}
      });
   }
   
   if (data.customCmd) {
      if (data.customCmd == "removeAsset") {
         bundler.assets.delete(data.path);

         postMessage({
            ...data,
            assets: bundler.assets,
         });
      }
   }

   console.log(bundler);
};

bundler.hooks.failedLoader(async (descriptor) => {
   let BabelPattern = /\.(t|j)sx?$/; // .js, .ts, .jsx, .tsx
   if (BabelPattern.test(descriptor.asset.source)) {
      let BabelLoader = await import("toypack/lib/BabelLoader.js");
      bundler.loaders.push(new BabelLoader.default());
   }
   
   let VuePattern = /\.vue$/; // .vue
   if (VuePattern.test(descriptor.asset.source)) {
      let VueLoader = await import("toypack/lib/VueLoader.js");
      bundler.loaders.push(new VueLoader.default());
   }
   
   let SassPattern = /\.s(a|c)ss$/; // .sass, .scss
   if (SassPattern.test(descriptor.asset.source)) {
      let SassLoader = await import("toypack/lib/SassLoader.js");
      bundler.loaders.push(new SassLoader.default());
   }
});