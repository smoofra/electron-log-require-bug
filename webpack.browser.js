var webpack = require('webpack');

module.exports = {
  entry:  './renderer.js',
  target: 'electron-renderer',
  output: {
    filename: 'browser.bundle.js',
  },
}
