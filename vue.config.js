const { defineConfig } = require('@vue/cli-service')

module.exports = defineConfig({
  transpileDependencies: true,
  lintOnSave: false,
  devServer: {
    proxy: {
      '/api-emt': {
        target: 'https://opendata.vlci.valencia.es',
        changeOrigin: true,
        pathRewrite: {
          '^/api-emt': ''
        }
      },
      '/api-qr': {
        target: 'http://www.emtvalencia.es',
        changeOrigin: true,
        pathRewrite: { '^/api-qr': '' }
      }
    }
  }
})