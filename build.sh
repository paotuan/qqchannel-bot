#!/bin/bash
read -p "请输入版本号(请复制完全,前面的v也需要带):" version
url="https://github.com/paotuan/qqchannel-bot/archive/refs/tags/$version.zip"
wget $url
version=${version:1}
filename=$(basename $url)
unzip $filename
cd qqchannel-bot-$version
read -p "请输入构建镜像的名称(建议带dockerhub用户名,方便push,如monthwolf/paotuan):" image
read -p "请输入构建镜像的tag(默认与版本号一致):" tag
#如果tag为空则设为版本号
if [ -z "$tag" ];then
    tag=$version
fi
dockertag=$image:$tag
echo "正在构建$dockertag"
docker build -t $dockertag .
#删除解压文件夹和下载文件
cd ..
echo "构建完成!正在删除文件夹和下载文件..."
rm -rf qqchannel-bot-$version $filename
#询问是否运行容器
read -p "删除完成!是否运行容器(y/n):" run
if [ $run == "y" ];then
    read -p "请输入IP(默认0.0.0.0,不输入即为默认值):" ip
    ip=${ip:-0.0.0.0}
    read -p "请输入第一个端口号(默认4174):" port1
    read -p "请输入第二个端口号(默认4175):" port2
    port1=${port1:-4174}
    port2=${port2:-4175}
    docker run -d --net=host \
    -e WS_SERVER_ADDR=$ip \
    -e WS_SERVER_PORT=$port1 \
    -e WEB_PORT=$port2 \
    --name paotuan $dockertag
else
    echo "已退出"
fi
