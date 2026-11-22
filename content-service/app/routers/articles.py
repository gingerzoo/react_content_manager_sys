from fastapi import APIRouter, HTTPException, Query, Response

from app.schemas.article import (
    ArticleCreate,
    ArticleListResponse,
    ArticleResponse,
    ArticleUpdate
)
from app.services.article_service import (
    article_service
)


router = APIRouter(
    prefix="/articles",
    tags=["articles"]
)


@router.get(
    "",
    response_model=ArticleListResponse,
    summary="查询文章列表"
)
def list_articles(
    keyword: str = "",
    limit: int = Query(
        default=10,
        ge=1,
        le=20
    )
):
    return article_service.find_articles(
        keyword=keyword,
        limit=limit
    )


@router.post(
    "",
    response_model=ArticleResponse,
    status_code=201,
    summary="创建文章"
)
def create_article(
    data: ArticleCreate
):
    return article_service.create_article(
        title=data.title,
        summary=data.summary,
        body=data.body,
        status=data.status
    )


@router.get(
    "/{article_id}",
    response_model=ArticleResponse,
    summary="查询文章详情"
)
def get_article(article_id: int):
    article = (
        article_service.find_article(
            article_id
        )
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="文章不存在"
        )

    return article

@router.patch(
    "/{article_id}",
    response_model=ArticleResponse,
    summary="编辑文章"
)
def update_article(
    article_id: int,
    data: ArticleUpdate
):
    changes = data.model_dump(
        exclude_unset=True
    )

    article = (
        article_service.update_article(
            article_id=article_id,
            changes=changes
        )
    )

    if article is None:
        raise HTTPException(
            status_code=404,
            detail="文章不存在"
        )

    return article

@router.delete(
    "/{article_id}",
    status_code=204,
    response_class=Response,
    summary="删除文章"
)
def delete_article(article_id: int) -> Response:
    """软删除路径中指定的文章。

    参数:
        article_id (int): URL 中的文章 ID。

    返回:
        Response: 删除成功时返回状态码 204，响应体为空。

    异常:
        HTTPException: 文章不存在或此前已删除时返回 404。
    """
    deleted = article_service.delete_article(article_id)

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="文章不存在"
        )

    return Response(status_code=204)