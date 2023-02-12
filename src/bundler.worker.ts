import Toypack from "toypack";
const bundler = new Toypack({
   bundleOptions: {},
});

function getSimplifiedAssets() {
   let assets = Object.fromEntries(bundler.assets);
   return Object.values(assets).map((el) => ({
      source: el.source,
      content: el.content,
   }));
}

onmessage = async (event) => {
   const data = event.data;

   if (data.cmd) {
      const result = await bundler[data.cmd](...data.args);

      postMessage({
         ...data,
         result: data.cmd == "bundle" ? result : {},
      });
   }

   if (data.customCmd) {
      if (data.customCmd == "removeAsset") {
         bundler.assets.delete(data.path);

         postMessage({
            ...data,
            assets: getSimplifiedAssets(),
         });
      }

      if (data.customCmd == "installPackage") {
         let version = data.version ? "@" + data.version : "";
         await bundler.packageManager.install(data.name + version);

         postMessage({
            ...data,
            assets: getSimplifiedAssets(),
         });
      }
   }

   console.log(bundler);
};

bundler.hooks.failedLoader(async (descriptor) => {
   let BabelPattern = /\.(t|j)sx?$/; // .js, .ts, .jsx, .tsx
   if (BabelPattern.test(descriptor.asset.source)) {
      let BabelLoader = await import("toypack/lib/BabelLoader.js");
      let loopProtectPlugin = await import("@freecodecamp/loop-protect");
      let slowLoopTimeLimitMS = 100;
      bundler.loaders.push(
         new BabelLoader.default({
            registerPlugins: [
               ["loopProtect", loopProtectPlugin.default(slowLoopTimeLimitMS)],
            ],
            transformOptions: {
               plugins: ["loopProtect"],
            },
         })
      );
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
