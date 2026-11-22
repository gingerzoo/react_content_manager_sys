from typing import TypedDict


class ArticleRecord(TypedDict):
    id: int
    title: str
    summary: str

ARTICLES: list[ArticleRecord] = [
    {
        "id": 1,
        "title": "React 状态管理实践",
        "summary": "介绍 React 项目中的状态管理方案"
    },
    {
        "id": 2,
        "title": "Vue 组件设计指南",
        "summary": "介绍 Vue 组件拆分和通信方式"
    },
    {
        "id": 3,
        "title": "FastAPI 入门",
        "summary": "使用 Python 开发后端接口"
    }
]