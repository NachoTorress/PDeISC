const path = require("node:path");
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
const blobRoot = path.resolve(
  path.dirname(require.resolve("@vercel/blob/client")),
  "..",
);

// Metro resuelve los reemplazos browser del SDK desde dist; usar sus shims oficiales.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    context.originModulePath.startsWith(blobRoot + path.sep) &&
    ["undici", "crypto", "stream"].includes(moduleName)
  ) {
    return {
      type: "sourceFile",
      filePath: path.join(blobRoot, "dist", `${moduleName}-browser.js`),
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
