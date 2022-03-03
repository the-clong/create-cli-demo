const defaultUrls = [];

// 这里配置代理
module.exports = {
    // 关于proxy的context用法:https://webpack.js.org/configuration/dev-server/#devserverproxy
    context: defaultUrls.map((iteUrl) => `/${iteUrl}`),
    '/api': {
        target: 'http://localhost:3000',
        pathRewrite: { '^/api': '' },
    },
};
