export default {
  plugins: {
    'postcss-pxtorem': {
      rootValue: 100, // 1rem = 100px（默认值，可修改）
      propList: ['*'], // 所有属性都转换
      selectorBlackList: [], // 不转换的选择器
      minPixelValue: 2, // 小于 2px 不转换
    },
    'autoprefixer': {}, // 可选，自动添加浏览器前缀
  },
}
