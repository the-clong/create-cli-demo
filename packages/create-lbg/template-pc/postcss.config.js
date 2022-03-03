module.exports = {
    plugins: [
        require('postcss-preset-env'),
        require('postcss-pxtorem')({ rootValue: 75, propList: ['*'] }),
    ],
};
