FROM node:slim
WORKDIR /usr/local
EXPOSE 4174 4175
ENV WS_SERVER_ADDR=0.0.0.0 WS_SERVER_PORT=4174 WEB_PORT=4175
RUN sed -i "s@http://\(deb\|security\).debian.org@http://mirrors.aliyun.com@g" /etc/apt/sources.list.d/debian.sources && \
apt-get update && chmod 777 /usr/local/ && \
apt-get install -y git && \
npm i yarn -g --force \
&& yarn config set registry https://registry.npmmirror.com/ \
&& git clone https://github.com/paotuan/qqchannel-bot.git \
&& cd qqchannel-bot && yarn install
ENTRYPOINT cd qqchannel-bot && echo -e "WS_SERVER_ADDR=$WS_SERVER_ADDR\nWS_SERVER_PORT=$WS_SERVER_PORT\nWEB_PORT=$WEB_PORT">>.env \
	&& yarn run build && yarn global add pm2 \
	&& cd dist && yarn install \
	&& cd .. && yarn run start \ 
	&& pm2 logs qqchannel-bot --lines 100
