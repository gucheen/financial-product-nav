# 年化收益计算器

原生 HTML、CSS 和 JavaScript 静态页面，用净值变化、净收益或区间收益率计算单利及复利年化收益率。无需安装依赖、构建或后端服务。

## 本地预览

在项目目录启动任意静态文件服务器，例如：

```sh
python3 -m http.server 3000 --bind 127.0.0.1
```

打开 http://localhost:3000。页面使用 ES modules，需通过 HTTP 访问，不要直接双击 HTML 文件。

## 文件结构

```text
index.html            页面结构
style.css             响应式样式
app.js                页面交互与本地记录
calculator.js         收益计算与输入校验
logo.svg              网站图标
vendor/               Big.js 7.0.1 及 MIT 许可证
tests/               计算测试
.github/workflows/    测试与 GitHub Pages 发布
```

Big.js 使用仓库内的原始模块，金额与费用计算不依赖外部 CDN。其来源为 [big.js 7.0.1](https://github.com/MikeMcl/big.js/tree/v7.0.1)，升级时需同时替换 `vendor/big.mjs` 和许可证并运行测试。

## 测试

使用 Node.js 20 或更新版本：

```sh
node --test
```

`package.json` 仅声明 JavaScript 模块类型并提供 `npm test` 快捷命令，没有 npm 依赖。运行网站不需要 Node.js。

## GitHub Pages

工作流按 [GitHub 官方 Pages 文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)配置。

1. 在仓库 **Settings → Pages → Build and deployment → Source** 选择 **GitHub Actions**。
2. 推送到 `main` 后自动运行测试；通过后直接上传静态文件并发布，无需安装依赖或构建。
3. 也可在 Actions 中手动运行 **GitHub Pages** 工作流（选择 `main`）。PR 只运行测试，不发布。

发布文件使用相对路径，兼容 `https://gucheen.github.io/financial-product-nav/` 这样的项目子目录，也适用于自定义域名。仅上传页面资源与许可证，测试文件不进入发布产物。

## 计算口径

- 三种输入：净值变化、本金与净收益、区间收益率。
- 单利年化 = 区间收益率 × 365 / 持有天数。
- 复利年化 = (1 + 区间收益率) ^ (365 / 持有天数) − 1。
- 日期按结束日期减开始日期，不额外包含起始日；一年固定按 365 天。
- 净值模式按外扣法计算申购份额，再扣除赎回费用；费率输入单位为百分比。
- 金额和费用以 Big.js 计算，非整数幂使用浮点近似。展示精度为两位小数，不在中间步骤提前舍入。
- 支持零收益、亏损及本金全部损失，拒绝超出本金的亏损和无效输入。
- 适用于单笔投入；多次追加、赎回及分红再投资需要现金流或复权数据，暂不支持。

计算记录仅存储在当前浏览器的 localStorage（`annual-return-records-v1`），最多保留 50 条，可载入和删除。相同来源下的已有记录可继续读取；本地预览与 GitHub Pages 是不同来源，不会共享记录。清除浏览器数据会删除记录。年化结果是历史区间的折算，不代表未来收益。
