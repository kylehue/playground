interface ResolveOptions {
   alias: Record<string, string>;
   fallback: Record<string, string>;
   extensions: Array<string>;
}

interface BundlerOptions {
   entry: string;
   envMode: "development" | "production";
   sourceMap: "full" | "none" | "cheap";
   infiniteLoopProtection: boolean;
   resolve: ResolveOptions;
   replace: Record<string, string>;
}

const options: BundlerOptions = {
   entry: "/",
   infiniteLoopProtection: true,
   envMode: "development",
   replace: {},
   resolve: {
      alias: {},
      fallback: {},
      extensions: ["js", "json"],
   },
   sourceMap: "cheap",
};

export default options;