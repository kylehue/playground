const registryURL = "https://registry.npmjs.org/";

export interface PackageResult {
   name: string;
   description: string;
   version: string;
}

export async function searchPackagesByName(searchText: string, { size = 10 } = {}): Promise<PackageResult[]> {
   if (!searchText) return [] as PackageResult[];

   let parsedSearchText = encodeURIComponent(searchText).replace("%2C", "+");

   const url = `${registryURL}-/v1/search?text=${parsedSearchText}&size=${size}`;

   let fetchResponse = await fetch(url);
   let json = await fetchResponse.json();

   return json.objects.map((element) => ({
      name: element.package.name,
      description: element.package.description,
      version: element.package.version
   }));
}

export async function searchPackage(
   packageName: string
) {
   if (!packageName) return null;

   const url = `${registryURL}${packageName}`;
   let fetchResponse = await fetch(url);

   let json = await fetchResponse.json();

   return json;
}
