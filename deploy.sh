#!/bin/bash

# 个人主页快速部署脚本
# 用法: ./deploy.sh [docker|docker-compose]

set -e

echo "========================================="
echo "  个人主页 - 快速部署脚本"
echo "========================================="
echo ""

# 检查 Docker 是否安装
check_docker() {
    if ! command -v docker &> /dev/null; then
        echo "❌ Docker 未安装，请先安装 Docker"
        echo "访问: https://docs.docker.com/get-docker/"
        exit 1
    fi
    echo "✅ Docker 已安装"
}

# 方式一：Docker 部署
deploy_docker() {
    echo ""
    echo "📦 使用 Docker 部署..."
    echo ""

    # 停止并删除旧容器
    if [ "$(docker ps -aq -f name=personal-homepage)" ]; then
        echo "🔄 停止旧容器..."
        docker stop personal-homepage 2>/dev/null || true
        docker rm personal-homepage 2>/dev/null || true
    fi

    # 构建镜像
    echo "🏗️  构建 Docker 镜像..."
    docker build -t personal-homepage .

    # 创建数据目录
    mkdir -p ./data

    # 运行容器
    echo "🚀 启动容器..."
    docker run -d \
        --name personal-homepage \
        -p 3000:3000 \
        -v $(pwd)/data:/app/data \
        --restart unless-stopped \
        personal-homepage

    echo ""
    echo "✅ 部署成功！"
    echo "📍 访问地址: http://localhost:3000"
    echo "📍 或使用: http://$(hostname -I | awk '{print $1}'):3000"
}

# 方式二：Docker Compose 部署
deploy_docker_compose() {
    echo ""
    echo "📦 使用 Docker Compose 部署..."
    echo ""

    # 检查 docker-compose 是否安装
    if ! command -v docker-compose &> /dev/null; then
        echo "❌ Docker Compose 未安装"
        echo "尝试使用 'docker compose' (Docker 内置版本)"

        # 使用 docker compose (Docker 新版本内置)
        docker compose down 2>/dev/null || true
        docker compose up -d --build
    else
        # 使用独立的 docker-compose
        docker-compose down 2>/dev/null || true
        docker-compose up -d --build
    fi

    echo ""
    echo "✅ 部署成功！"
    echo "📍 访问地址: http://localhost:3000"
    echo "📍 或使用: http://$(hostname -I | awk '{print $1}'):3000"
}

# 主流程
main() {
    check_docker

    # 如果没有参数，提示用户选择
    if [ $# -eq 0 ]; then
        echo "请选择部署方式："
        echo "  1) Docker"
        echo "  2) Docker Compose (推荐)"
        echo ""
        read -p "请输入选项 (1/2): " choice

        case $choice in
            1)
                deploy_docker
                ;;
            2)
                deploy_docker_compose
                ;;
            *)
                echo "❌ 无效选项"
                exit 1
                ;;
        esac
    else
        # 根据参数选择部署方式
        case $1 in
            docker)
                deploy_docker
                ;;
            docker-compose)
                deploy_docker_compose
                ;;
            *)
                echo "用法: $0 [docker|docker-compose]"
                exit 1
                ;;
        esac
    fi

    echo ""
    echo "📝 提示:"
    echo "  - 查看日志: docker logs -f personal-homepage"
    echo "  - 停止服务: docker stop personal-homepage"
    echo "  - 重启服务: docker restart personal-homepage"
    echo "  - 数据位置: ./data/nav.db"
    echo ""
}

main "$@"
