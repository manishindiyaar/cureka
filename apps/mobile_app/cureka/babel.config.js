module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          extensions: ['.tsx', '.ts', '.js', '.json', '.svg', '.png'],
          root: ['./src'],
          alias: {
            '@/components': './src/components',
            '@/constants': './src/constants',
            '@/hooks': './src/hooks',
            '@/lib': './src/lib',
            '@/types': './src/types',
            '@': './src',
          },
        },
      ],
      'react-native-reanimated/plugin',
    ],
  };
};