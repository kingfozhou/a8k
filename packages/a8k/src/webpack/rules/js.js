import path from 'path';
import { ENV_DEV, TYPE_SERVER } from '../../const';

module.exports = (config, context, { type }) => {
  let include = [];
  if (context.config.babel) {
    include = context.config.babel.include || [];
  }

  // TODO 需要抽离成插件？
  // 加载 imui 里的 // @require '.css'
  config.module
    .rule('imui')
    .test(/\.js$/)
    .include.add(context.resolve('node_modules/imui'))
    .end()
    .use('comment-require-loader')
    .loader('comment-require-loader')
    .options({});

  let rule = config.module
    .rule('js')
    .test(/\.(js|mjs|jsx)$/)
    .include // 热重载插件需要被编译
    .add(context.resolve('src'))
    .add(context.resolve('node_modules/@tencent'));

  // 自定义babel处理内容
  include.forEach(i => (rule = rule.add(i)));
  // 开发模式下需要处理这些资源
  if (context.config.webpackMode === ENV_DEV) {
    rule = rule.add(/webpackHotDevClient|strip-ansi|formatWebpackMessages|chalk|ansi-styles/);
  }

  rule
    .end()
    // 忽略哪些压缩的文件
    .exclude.add(/(.|_)min\.js$/)
    .end()
    .use('babel-loader')
    .loader('babel-loader')
    .options({
      babelrc: false,
      // cacheDirectory 缓存babel编译结果加快重新编译速度
      cacheDirectory: path.resolve(context.config.cache, 'babel-loader'),
      presets: [[require.resolve('babel-preset-imt'), { isSSR: type === TYPE_SERVER }]],
      plugins: [
        context.config.webpackMode === ENV_DEV && require.resolve('react-hot-loader/babel'),
      ].filter(Boolean),
    });
};
