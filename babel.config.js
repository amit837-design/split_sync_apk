module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"], // This is the default Expo preset
    plugins: [
      [
        "module:react-native-dotenv",
        {
          moduleName: "@env",
          path: ".env",
          blacklist: null,
          whitelist: null,
          safe: false,
          allowUndefined: true,
        },
      ],
    ],
  };
};
