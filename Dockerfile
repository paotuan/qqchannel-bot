FROM centos
RUN chmod 777 /usr/local/
WORKDIR /usr/local
ENV WS_SERVER_ADDR=localhost WS_SERVER_PORT=4174 WEB_PORT=4175
RUN cd /etc/yum.repos.d/ \
	&&sed -i 's/mirrorlist/#mirrorlist/g' /etc/yum.repos.d/CentOS-* \
	&&sed -i 's|#baseurl=http://mirror.centos.org|baseurl=http://vault.centos.org|g' /etc/yum.repos.d/CentOS-*
# 安装 epel 软件包和nodejs
RUN yum install epel-release -y\
    && yum install nodejs -y\
    && yum install git -y\
    && node -v && npm -v \
    && npm install -g n && n 16.16.0 \
    && n use 16.16.0 && n rm 10.24.0
# 安装项目和依赖
RUN npm i yarn -g \
	&& yarn config set registry https://registry.npmmirror.com/ \
	&& git clone https://github.com/paotuan/qqchannel-bot.git \
 	&& cd qqchannel-bot && yarn install \
	&& yarn global add pm2 
# 持久化运行和环境变量修改
ENTRYPOINT cd qqchannel-bot && echo -e "WS_SERVER_ADDR=$WS_SERVER_ADDR\nWS_SERVER_PORT=$WS_SERVER_PORT\nWEB_PORT=$WEB_PORT">>.env \
	&& yarn run build \
	&& cd dist && yarn install \
	&& cd .. && yarn run start \ 
	&& pm2 logs qqchannel-bot --lines 100
