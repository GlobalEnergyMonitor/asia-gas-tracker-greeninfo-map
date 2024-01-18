module.exports = {
  plugins: [
    [
      "postcss-preset-env",
      {
        // Options
        // see https://github.com/csstools/postcss-preset-env#readme
        // Without any configuration options, PostCSS Preset Env enables Stage 2 features and supports all browsers.
        // or you can limit it with a variety of passed options, such as: 
        // browsers: 'last 2 versions',
        // stage: 4, // stable
      },
    ],
  ],
};