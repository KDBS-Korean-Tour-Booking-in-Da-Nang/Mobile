module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: [
      // ⚡ Quan trọng: Luôn để plugin reanimated cuối cùng
      "react-native-reanimated/plugin",

      // Plugin cho worklets-core
      "react-native-worklets-core/plugin",
    ],
  };
};
