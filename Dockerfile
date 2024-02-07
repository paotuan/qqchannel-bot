FROM node:slim
WORKDIR /usr/local
EXPOSE 4174 4175
ENV WS_SERVER_ADDR=0.0.0.0 WS_SERVER_PORT=4174 WEB_PORT=4175
COPY . qqchannel-bot/
RUN chmod 777 /usr/local/ && \
npm i yarn -g --force && \
yarn config set registry https://registry.npmmirror.com/ && \
cd qqchannel-bot && yarn install
ENTRYPOINT cd qqchannel-bot && echo -e "WS_SERVER_ADDR=$WS_SERVER_ADDR\nWS_SERVER_PORT=$WS_SERVER_PORT\nWEB_PORT=$WEB_PORT">>.env \
	&& yarn run build && yarn global add pm2 \
	&& cd dist && yarn install \
	&& cd .. && yarn run start \ 
	&& pm2 logs qqchannel-bot --lines 100
