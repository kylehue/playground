const registryURL = "https://registry.npmjs.org/";

export async function searchPackagesByName(searchText: string, { size = 10 } = {}) {
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
   const url = `${registryURL}${packageName}`;
   let fetchResponse = await fetch(url);

   let json = await fetchResponse.json();

   return json;
}
