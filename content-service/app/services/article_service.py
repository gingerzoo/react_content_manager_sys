from app.repositories.article_repository import (
    ArticleRepository,
    article_repository
)


class ArticleService:
    def __init__(
        self,
        repository: ArticleRepository
    ):
        self.repository = repository

    def find_articles(
        self,
        keyword: str,
        limit: int
    ) -> dict:
        normalized_keyword = (
            keyword
            .strip()
        )

        articles = self.repository.find_many(
            keyword=normalized_keyword,
            limit=limit
        )

        total = self.repository.count(
            keyword=normalized_keyword
        )

        return {
            "list": articles,
            "total": total
        }

    def find_article(
        self,
        article_id: int
    ) -> dict | None:
        return self.repository.find_by_id(
            article_id=article_id,
            published_only=True
        )

    def create_article(
        self,
        title: str,
        summary: str,
        body: str,
        status: str
    ) -> dict:
        return self.repository.create(
            title=title.strip(),
            summary=summary.strip(),
            body=body,
            status=status
        )

    def update_article(
        self,
        article_id: int,
        changes: dict[str, str]
    ) -> dict | None:
        normalized_changes = changes.copy()

        if "title" in normalized_changes:
            normalized_changes["title"] = (
                normalized_changes["title"]
                .strip()
            )

        if "summary" in normalized_changes:
            normalized_changes["summary"] = (
                normalized_changes["summary"]
                .strip()
            )

        return self.repository.update(
            article_id=article_id,
            changes=normalized_changes
        )
    
    def delete_article(self, article_id: int) -> bool:
        """按 ID 软删除文章。

        参数:
            article_id (int): 要删除的文章 ID。

        返回:
            bool: 本次成功删除返回 True，
                文章不存在或此前已删除返回 False。
        """
        return self.repository.soft_delete(article_id)


article_service = ArticleService(
    repository=article_repository
)