module.exports = {
  root: true,
  extends: ['@react-native-community', 'plugin:react/recommended'],
  parser: '@babel/eslint-parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
  },
  plugins: ['react'],
  rules: {
    // Add any specific rules you need
  },
};
