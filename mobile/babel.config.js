module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      [
        "module-resolver",
        {
          alias: {
            "@/api": "./src/api",
            "@/components": "./src/components",
            "@/hooks": "./src/hooks",
            "@/navigation": "./src/navigation",
            "@/screens": "./src/screens",
            "@/storage": "./src/storage",
            "@/types": "./src/types",
            "@/providers": "./src/providers"
          }
        }
      ]
    ]
  };
};
