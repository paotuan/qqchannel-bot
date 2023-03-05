# 🎲 QQ 频道跑团机器人

基于 [QQ 频道官方机器人 API](https://bot.q.qq.com/wiki/#%E7%AE%80%E4%BB%8B) 的跑团工具。可以方便快捷地为你的 QQ 频道加入骰子，并提供多种实用的跑团后台管理功能。

相比于传统的非官方 QQ 群机器人，QQ 频道有官方 API，接口更为稳定。同时配套功能更加丰富，搭建更加容易。

相比于我们之前搭建的[独立跑团平台](https://github.com/paotuan/paotuan)，QQ 频道机器人允许你直接在 QQ 内部和朋友一起跑团，使用更方便。

## 使用方式

请访问我们的官方网站 [paotuan.io](https://paotuan.io) 查看最新的使用文档。

也可以通过以下视频了解工具的部分功能演示：[【bilibili】QQ频道跑团机器人合集](https://space.bilibili.com/688429881/channel/collectiondetail?sid=1162902)

欢迎 [加入我们的官方频道](https://pd.qq.com/s/gv78r06x1) 体验机器人各项指令功能

### 一键使用
如果你不了解代码，或只是想用最简单的方式用起来，可以直接下载二进制包，本地运行。

请参考 [Windows 运行](https://paotuan.io/setup/download/windows.html) 或 [macOS 运行](https://paotuan.io/setup/download/macos.html)

你可以在 [releases 页面](https://github.com/paotuan/qqchannel-bot/releases) 找到所有的历史版本。

### 服务器部署
请参考 [Linux 部署](https://paotuan.io/setup/download/linux.html)

### 本地开发
require Node >= 14.18

```bash
yarn install
yarn run dev:server
yarn run dev:client
```

## 功能展示
- 无缝集成 QQ，支持各种常用骰子规则和指令
- 自动记录跑团 Log，支持多种格式导出
- 发布和管理重要笔记，置顶跑团关键线索
- 导入文本/Excel 人物卡，在线编辑和托管，人物卡关联频道用户
- 骰子根据人物卡自动判断成功等级，记录技能成长
- 可视化地图编辑器与战斗面板，优雅主持战斗轮
- 多种主题一键切换


任何意见建议，欢迎 issue，pr 或加群 115699014 讨论。
