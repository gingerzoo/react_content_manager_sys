from app.db.mysql import get_connection


class ArticleRepository:
    def find_many(
        self,
        keyword: str,
        limit: int
    ) -> list[dict]:
        where_sql = """
                WHERE deleted_at IS NULL
            AND status = 'published'
        """
        params = []

        if keyword:
            where_sql += """
                AND (
                    LOCATE(%s, title) > 0
                    OR LOCATE(%s, summary) > 0
                )
            """
            params.extend([
                keyword,
                keyword
            ])

        params.append(limit)

        connection = get_connection()

        try:
            cursor = connection.cursor(
                dictionary=True
            )

            try:
                cursor.execute(
                    f"""
                    SELECT
                        id,
                        title,
                        summary
                    FROM contents
                    {where_sql}
                    ORDER BY id DESC
                    LIMIT %s
                    """,
                    tuple(params)
                )

                return cursor.fetchall()
            finally:
                cursor.close()
        finally:
            connection.close()

    def count(
        self,
        keyword: str
    ) -> int:
        where_sql = """
                WHERE deleted_at IS NULL
            AND status = 'published'
        """
        params = []

        if keyword:
            where_sql += """
                AND (
                    LOCATE(%s, title) > 0
                    OR LOCATE(%s, summary) > 0
                )
            """
            params.extend([
                keyword,
                keyword
            ])

        connection = get_connection()

        try:
            cursor = connection.cursor(
                dictionary=True
            )

            try:
                cursor.execute(
                    f"""
                    SELECT COUNT(*) AS total
                    FROM contents
                    {where_sql}
                    """,
                    tuple(params)
                )

                result = cursor.fetchone()

                return result["total"]
            finally:
                cursor.close()
        finally:
            connection.close()

    def find_by_id(
        self,
        article_id: int,
        published_only: bool = False
    ) -> dict | None:
        status_sql = ""

        if published_only:
            status_sql = """
                AND status = 'published'
            """
        connection = get_connection()

        try:
            cursor = connection.cursor(
                dictionary=True
            )

            try:
                cursor.execute(
                    f"""
                    SELECT
                        id,
                        title,
                        summary,
                        body,
                        status,
                        created_at,
                        updated_at
                    FROM contents
                    WHERE id = %s
                        AND deleted_at IS NULL
                        {status_sql}
                    LIMIT 1
                    """,
                    (article_id,)
                )

                return cursor.fetchone()
            finally:
                cursor.close()
        finally:
            connection.close()

    def create(
        self,
        title: str,
        summary: str,
        body: str,
        status: str
    ) -> dict:
        connection = get_connection()

        try:
            cursor = connection.cursor()

            try:
                cursor.execute(
                    """
                    INSERT INTO contents (
                        title,
                        summary,
                        body,
                        status
                    )
                    VALUES (%s, %s, %s, %s)
                    """,
                    (
                        title,
                        summary,
                        body,
                        status
                    )
                )

                article_id = cursor.lastrowid

                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()
        finally:
            connection.close()

        article = self.find_by_id(
            article_id
        )

        if article is None:
            raise RuntimeError(
                "文章已创建，但无法读取创建结果"
            )

        return article
    
    def update(
        self,
        article_id: int,
        changes: dict
    ) -> dict | None:
        field_map = {
            "title": "title",
            "summary": "summary",
            "body": "body",
            "status": "status"
        }

        unknown_fields = (
            set(changes) - set(field_map)
        )

        if unknown_fields:
            raise ValueError(
                "包含不允许修改的字段"
            )

        if not changes:
            raise ValueError(
                "没有需要修改的字段"
            )

        assignments = ", ".join(
            f"{field_map[field_name]} = %s"
            for field_name in changes
        )

        params = [
            changes[field_name]
            for field_name in changes
        ]

        params.append(article_id)

        connection = get_connection()

        try:
            cursor = connection.cursor()

            try:
                cursor.execute(
                    f"""
                    UPDATE contents
                    SET {assignments}
                    WHERE id = %s
                        AND deleted_at IS NULL
                    """,
                    tuple(params)
                )

                connection.commit()
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()
        finally:
            connection.close()

        return self.find_by_id(article_id)

    def soft_delete(self, article_id: int) -> bool:
        """将指定文章标记为已删除。

        参数:
            article_id (int): 要删除的文章 ID。

        返回:
            bool: 本次成功标记一篇文章时返回 True。
                文章不存在或此前已删除时返回 False。
        """
        connection = get_connection()

        try:
            cursor = connection.cursor()
            try:
                cursor.execute(
                    """
                    UPDATE contents
                    SET deleted_at = CURRENT_TIMESTAMP
                    WHERE id = %s
                      AND deleted_at IS NULL
                    """,
                    (article_id,)
                )

                deleted = cursor.rowcount == 1
                connection.commit()
                return deleted
            except Exception:
                connection.rollback()
                raise
            finally:
                cursor.close()
        finally:
            connection.close()

article_repository = ArticleRepository()