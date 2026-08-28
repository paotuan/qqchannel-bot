# koishi-plugin-adapter-onebot

适用于 [Koishi](https://koishi.chat/) 的 OneBot 适配器。

[OneBot](https://github.com/howmanybots/onebot) 是一个聊天机器人应用接口标准。

## 配置项

### config.protocol

- 可选值: http, ws, ws-reverse

要使用的协议类型。

### config.token

- 类型：`string`

发送信息时用于验证的字段。

### config.endpoint

- 类型：`string`

如果使用了 HTTP，则该配置将作为发送信息的服务端；如果使用了 WebSocket，则该配置将作为监听事件和发送信息的服务端。

### config.proxyAgent

- 类型: `string`
- 默认值: [`app.config.request.proxyAgent`](https://koishi.chat/zh-CN/api/core/app.html#options-request-proxyagent)

请求时默认使用的网络代理。

### config.path

- 类型：`string`
- 默认值：`'/onebot'`

服务器监听的路径。仅用于 HTTP 或 WS Reverse 通信方式。

### config.secret

- 类型：`string`

接收信息时用于验证的字段，应与 OneBot 的 `secret` 配置保持一致。

## 内部 API

你可以通过 `bot.internal` 或 `session.onebot` 访问内部 API，参见 [访问内部接口](https://koishi.chat/zh-CN/guide/adapter/bot.html#internal-access)。

### OneBot v11 标准 API

- [`onebot.sendPrivateMsg()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#send_private_msg-发送私聊消息)
- [`onebot.sendGroupMsg()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#send_group_msg-发送群消息)
- [`onebot.deleteMsg()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#delete_msg-撤回消息)
- [`onebot.getMsg()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_msg-获取消息)
- [`onebot.getForwardMsg()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_forward_msg-获取合并转发消息)
- [`onebot.sendLike()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#send_like-发送好友赞)
- [`onebot.setGroupKick()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_kick-群组踢人)
- [`onebot.setGroupBan()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_ban-群组单人禁言)
- [`onebot.setGroupAnonymousBan()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_anonymous_ban-群组匿名用户禁言)
- [`onebot.setGroupWholeBan()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_whole_ban-群组全员禁言)
- [`onebot.setGroupAdmin()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_admin-群组设置管理员)
- [`onebot.setGroupAnonymous()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_anonymous-群组匿名)
- [`onebot.setGroupCard()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_card-设置群名片群备注)
- [`onebot.setGroupName()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_name-设置群名)
- [`onebot.setGroupLeave()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_leave-退出群组)
- [`onebot.setGroupSpecialTitle()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_special_title-设置群组专属头衔)
- [`onebot.setFriendAddRequest()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_friend_add_request-处理加好友请求)
- [`onebot.setGroupAddRequest()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_group_add_request-处理加群请求邀请)
- [`onebot.getLoginInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_login_info-获取登录号信息)
- [`onebot.getStrangerInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_stranger_info-获取陌生人信息)
- [`onebot.getFriendList()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_friend_list-获取好友列表)
- [`onebot.getGroupInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_group_info-获取群信息)
- [`onebot.getGroupList()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_group_list-获取群列表)
- [`onebot.getGroupMemberInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_group_member_info-获取群成员信息)
- [`onebot.getGroupMemberList()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_group_member_list-获取群成员列表)
- [`onebot.getGroupHonorInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_group_honor_info-获取群荣誉信息)
- [`onebot.getCookies()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_cookies-获取-cookies)
- [`onebot.getCsrfToken()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_csrf_token-获取-csrf-token)
- [`onebot.getCredentials()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_credentials-获取-qq-相关接口凭证)
- [`onebot.getRecord()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_record-获取语音)
- [`onebot.getImage()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_image-获取图片)
- [`onebot.canSendImage()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#can_send_image-检查是否可以发送图片)
- [`onebot.canSendRecord()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#can_send_record-检查是否可以发送语音)
- [`onebot.getStatus()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_status-获取运行状态)
- [`onebot.getVersionInfo()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#get_version_info-获取版本信息)
- [`onebot.setRestart()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#set_restart-重启-onebot-实现)
- [`onebot.cleanCache()`](https://github.com/botuniverse/onebot-11/blob/master/api/public.md#clean_cache-清理缓存)

### go-cqhttp 扩展 API

- [`onebot.sendGroupForwardMsg()`](https://docs.go-cqhttp.org/api/#发送合并转发-群聊)
- [`onebot.markMsgAsRead()`](https://docs.go-cqhttp.org/api/#标记消息已读)
- [`onebot.sendGroupSign()`](https://docs.go-cqhttp.org/api/#群打卡)
- [`onebot.qidianGetAccountInfo()`](https://docs.go-cqhttp.org/api/#获取企点账号信息)
- [`onebot.setQqProfile()`](https://docs.go-cqhttp.org/api/#设置登录号资料)
- [`onebot.getUnidirectionalFriendList()`](https://docs.go-cqhttp.org/api/#获取单向好友列表)
- [`onebot.deleteFriend()`](https://docs.go-cqhttp.org/api/#删除好友)
- [`onebot.setGroupPortrait()`](https://docs.go-cqhttp.org/api/#设置群头像)
- [`onebot.getWordSlices()`](https://docs.go-cqhttp.org/api/#获取中文分词-隐藏-api)
- [`onebot.ocrImage()`](https://docs.go-cqhttp.org/api/#图片-ocr)
- [`onebot.getGroupSystemMsg()`](https://docs.go-cqhttp.org/api/#获取群系统消息)
- [`onebot.uploadPrivateFile()`](https://docs.go-cqhttp.org/api/#上传私聊文件)
- [`onebot.uploadGroupFile()`](https://docs.go-cqhttp.org/api/#上传群文件)
- [`onebot.getGroupFileSystemInfo()`](https://docs.go-cqhttp.org/api/#获取群文件系统信息)
- [`onebot.getGroupRootFiles()`](https://docs.go-cqhttp.org/api/#获取群根目录文件列表)
- [`onebot.getGroupFilesByFolder()`](https://docs.go-cqhttp.org/api/#获取群子目录文件列表)
- [`onebot.createGroupFileFolder()`](https://docs.go-cqhttp.org/api/#创建群文件文件夹)
- [`onebot.deleteGroupFolder()`](https://docs.go-cqhttp.org/api/#删除群文件文件夹)
- [`onebot.deleteGroupFile()`](https://docs.go-cqhttp.org/api/#删除群文件)
- [`onebot.getGroupFileUrl()`](https://docs.go-cqhttp.org/api/#获取群文件资源链接)
- [`onebot.getGroupAtAllRemain()`](https://docs.go-cqhttp.org/api/#获取群-全体成员-剩余次数)
- [`onebot.getVipInfo()`](https://github.com/Mrs4s/go-cqhttp/blob/master/docs/cqhttp.md?plain=1#L1081)
- [`onebot.sendGroupNotice()`](https://docs.go-cqhttp.org/api/#发送群公告)
- [`onebot.getGroupNotice()`](https://docs.go-cqhttp.org/api/#获取群公告)
- [`onebot.reloadEventFilter()`](https://docs.go-cqhttp.org/api/#重载事件过滤器)
- [`onebot.downloadFile()`](https://docs.go-cqhttp.org/api/#下载文件到缓存目录)
- [`onebot.getOnlineClients()`](https://docs.go-cqhttp.org/api/#获取当前账号在线客户端列表)
- [`onebot.getGroupMsgHistory()`](https://docs.go-cqhttp.org/api/#获取群消息历史记录)
- [`onebot.setEssenceMsg()`](https://docs.go-cqhttp.org/api/#设置精华消息)
- [`onebot.deleteEssenceMsg()`](https://docs.go-cqhttp.org/api/#移出精华消息)
- [`onebot.getEssenceMsgList()`](https://docs.go-cqhttp.org/api/#获取精华消息列表)
- [`onebot.checkUrlSafely()`](https://docs.go-cqhttp.org/api/#检查链接安全性)
- [`onebot.getModelShow()`](https://docs.go-cqhttp.org/api/#获取在线机型)
- [`onebot.setModelShow()`](https://docs.go-cqhttp.org/api/#设置在线机型)
- [`onebot.delete_unidirectional_friend()`](https://docs.go-cqhttp.org/api/#删除单向好友)
- [`onebot.send_private_forward_msg()`](https://docs.go-cqhttp.org/api/#发送合并转发-好友)

### 频道 API

- [`onebot.getGuildServiceProfile()`](https://docs.go-cqhttp.org/api/guild.html#获取频道系统内bot的资料)
- [`onebot.getGuildList()`](https://docs.go-cqhttp.org/api/guild.html#获取频道列表)
- [`onebot.getGuildMetaByGuest()`](https://docs.go-cqhttp.org/api/guild.html#通过访客获取频道元数据)
- [`onebot.getGuildChannelList()`](https://docs.go-cqhttp.org/api/guild.html#获取子频道列表)
- [`onebot.getGuildMembers()`](https://docs.go-cqhttp.org/api/guild.html#获取频道成员列表)
- [`onebot.sendGuildChannelMsg()`](https://docs.go-cqhttp.org/api/guild.html#发送信息到子频道)

## 许可证

使用 [MIT](./LICENSE) 许可证发布。

```
THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS
FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR
COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN
CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
```
