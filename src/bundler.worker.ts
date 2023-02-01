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
         result,
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
};