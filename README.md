# 🎲 QQ 频道跑团机器人

基于 [QQ 频道官方机器人 API](https://bot.q.qq.com/wiki/#%E7%AE%80%E4%BB%8B) 的跑团工具。可以方便快捷地为你的 QQ 频道加入骰子，并提供多种实用的跑团后台管理功能。

相比于传统的非官方 QQ 群机器人，QQ 频道有官方 API，接口更为稳定。同时配套功能更加丰富，搭建更加容易。

相比于我们之前搭建的[独立跑团平台](https://github.com/paotuan/paotuan)，QQ 频道机器人允许你直接在 QQ 内部和朋友一起跑团，使用更方便。

## 使用方式

[【bilibili】功能演示](https://www.bilibili.com/video/BV1hY4y1N7Ko/)

[【腾讯文档】QQ 频道跑团机器人使用指南](https://docs.qq.com/doc/DR3R6bFRNZWdsYUxt)

[【bilibili】搭建流程](https://docs.qq.com/doc/DR3R6bFRNZWdsYUxt)

欢迎 [加入我们的官方频道](https://pd.qq.com/s/gv78r06x1) 体验机器人各项指令功能

### 一键使用
如果你不了解代码，或只是想用最简单的方式用起来，可以直接下载二进制包，本地运行。

进入 [releases 页面](https://github.com/paotuan/qqchannel-bot/releases)，选择对应操作系统（win/mac）的最新版本下载即可。

如遇网络问题，可尝试使用 [Github Proxy](https://ghproxy.com/) 加速下载。

### 服务器部署
如果你希望机器人 24 小时不间断运行，你就需要把它部署到服务器上。（或者 24 小时从不关机的本地运行也可以）

```bash
yarn global add pm2
yarn install
yarn run build
```
构建产物会生成在 dist 目录下，如需前后端分离部署，各自部署 server 和 client 文件夹即可。（网页端需修改下服务器地址，后续暴露配置）

如需单体部署，则继续执行：
```bash
cd dist && yarn install
cd .. && yarn run start # 使用 pm2 后台执行
```
启动后需登录一次网页端挂上机器人和对应子频道，网页端默认端口号 4175

### 本地开发
require Node >= 14.18

```bash
yarn install
yarn run dev:server
yarn run dev:client
```

## 功能展示
- 无缝集成 QQ，支持各种常用骰子规则
- 自动记录跑团 Log，支持多种格式导出
- 发布和管理重要笔记，置顶跑团关键线索
- 导入文本/Excel 人物卡，在线编辑和托管，人物卡关联频道用户
- 骰子根据人物卡自动判断成功等级，记录技能成长
- 多种主题一键切换


任何意见建议，欢迎 issue，pr 或加群 115699014 讨论。早期开发中，代码结构可能改动较大，敬请谅解。
