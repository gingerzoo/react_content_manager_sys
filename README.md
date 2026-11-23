# 贝卡管理系统与 AI 内容助手

一个个人全栈项目。后台提供用户、部门和角色管理。登录后可以在内容助手里搜索系统内已发布的文章、阅读正文并获取摘要。DeepSeek 按需选择搜索或读取工具，页面通过 SSE 逐段展示回答和工具执行状态。

## 核心功能

- **后台管理**　Express 使用 JWT 验证登录身份，在接口层检查账号状态和角色权限。管理员可管理用户、部门和角色。默认查看者可查看部门和角色，并使用自己的内容助手会话。
- **文章服务**　FastAPI 提供文章读写接口，使用 Pydantic 校验请求数据。删除文章时记录删除时间。助手工具查询时只返回已发布且未删除的文章。
- **对话与历史**　支持中途停止生成和会话切换。历史消息按消息 ID 游标分页，向上加载旧消息时保持当前阅读位置。完整问答与会话更新通过同一个 MySQL 事务保存。

## 服务架构

React、TypeScript、Vite、Ant Design 和 Redux Toolkit 用于前端。Nginx 提供构建产物，并将浏览器发出的 `/api/` 请求转发给 Express。

| Compose 服务 | 职责 | 宿主机访问地址 |
| --- | --- | --- |
| `web` | Nginx 提供前端页面和 API 反向代理 | `http://127.0.0.1:18080` |
| `api` | Express 处理账号、权限、会话、模型和工具调用 | `http://127.0.0.1:18089` |
| `content-service` | FastAPI 提供文章接口和健康检查 | `http://127.0.0.1:18000` |
| `db` | MySQL 存储用户、权限、文章和会话 | `127.0.0.1:13306` |

一次文章问答从浏览器经 Nginx 到达 Express。Express 验证用户和会话归属，再请求 DeepSeek。模型返回工具调用时，Express 校验参数并向 FastAPI 查询文章，随后将工具结果交回模型。Express 把回答片段沿 SSE 转发给页面，完整问答写入数据库后发送 `done` 事件。

## 本地启动

准备 Docker Engine 或 Docker Desktop，确认 `docker compose version` 可运行。首次构建需要访问基础镜像和依赖仓库。

### 1 配置环境变量

在项目根目录创建 `.env.compose.local`。以下内容是填写模板，请替换三项必填值。该文件已通过 `*.local` 忽略。

```dotenv
MYSQL_ROOT_PASSWORD=
DB_PASSWORD=
JWT_SECRET=
DEEPSEEK_API_KEY=
ALLOW_PUBLIC_REGISTRATION=false
```

| 变量 | 用途 |
| --- | --- |
| `MYSQL_ROOT_PASSWORD` | 容器 MySQL 的 root 密码 |
| `DB_PASSWORD` | 应用数据库账号 `content_app` 的密码，由 Express 和 FastAPI 共用 |
| `JWT_SECRET` | Express 签发和验证登录令牌的密钥，可用 `openssl rand -hex 32` 生成 |
| `DEEPSEEK_API_KEY` | 服务端调用模型的凭证。可留空启动后台，验证真实模型回复时需填写 |
| `ALLOW_PUBLIC_REGISTRATION` | 控制自助注册，默认关闭 |

### 2 构建并启动服务

在项目根目录执行以下命令。第一条命令只检查配置，第二条构建并在后台启动容器，第三条查看运行状态。

```sh
docker compose --env-file .env.compose.local config --quiet
docker compose --env-file .env.compose.local up -d --build
docker compose --env-file .env.compose.local ps
```

MySQL 首次初始化空数据卷时会自动建表并导入示例文章。已有数据卷会保留数据，初始化 SQL 仅在空数据卷首次启动时执行。常规停止可以使用 `docker compose --env-file .env.compose.local down`。加上 `-v` 会删除数据库卷。

### 3 初始化菜单和管理员

```sh
docker compose --env-file .env.compose.local exec api node scripts/seed-default-menus.js
docker compose --env-file .env.compose.local exec api node scripts/create-admin.js
```

菜单脚本可重复执行。第一次运行管理员脚本时，根据提示输入账号和密码。脚本会显示输入内容，请在私人终端执行。已有管理员可以直接使用。进入 [后台登录页](http://127.0.0.1:18080/login) 后，可在用户管理中创建查看者账号。

## 演示流程

1. 使用查看者账号登录，在侧栏打开「内容运营」下的「内容助手」。
2. 发送「搜索标题含 React 的文章，读取《React 聊天页面如何保持滚动位置》的正文并总结」。观察工具执行状态和流式回复。
3. 刷新页面，确认最近会话恢复。可继续追问，也可在会话历史列表中切换会话。

需要检查文章服务和数据库连接时，可访问 [FastAPI 数据库健康检查](http://127.0.0.1:18000/health/db)。查看容器日志可执行：

```sh
docker compose --env-file .env.compose.local logs --tail=100 web api content-service db
```

## 云服务器部署

当前 Compose 配置将宿主机端口绑定到 `127.0.0.1`。在服务器上可先用相同的启动流程验证服务，再通过 SSH 端口转发进行私下演示。需要对外提供链接时，通过 HTTPS 反向代理 Web 服务，保留后端与数据库端口的回环绑定。演示建议使用示例数据、独立账号和受控的模型额度。

## 代码入口

- [内容助手页面](src/pages/main/story/chat/chat.tsx)负责对话交互、历史分页和滚动位置。
- [Agent 执行循环](server/agent/run-agent.js)负责工具调度与模型上下文。
- [文章接口](content-service/app/routers/articles.py)与 [Compose 配置](compose.yaml)分别定义文章服务入口和容器编排。
- [组织管理与权限说明](server/组织管理与权限说明.md)包含权限矩阵、接口说明和集成检查命令。
