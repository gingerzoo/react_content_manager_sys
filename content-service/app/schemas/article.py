from datetime import datetime
from typing import Literal, Self

from pydantic import (
    BaseModel,
    Field,
    model_validator
)


ArticleStatus = Literal[
    "draft",
    "published"
]


class ArticleCreate(BaseModel):
    title: str = Field(
        min_length=2,
        max_length=200,
        description="文章标题"
    )
    summary: str = Field(
        default="",
        max_length=500,
        description="文章摘要"
    )
    body: str = Field(
        min_length=1,
        description="文章正文"
    )
    status: ArticleStatus = Field(
        default="draft",
        description="文章状态"
    )


class ArticleListItem(BaseModel):
    id: int
    title: str
    summary: str


class ArticleResponse(BaseModel):
    id: int
    title: str
    summary: str
    body: str
    status: ArticleStatus
    created_at: datetime
    updated_at: datetime


class ArticleListResponse(BaseModel):
    list: list[ArticleListItem]
    total: int


class ArticleUpdate(BaseModel):
    title: str | None = Field(
        default=None,
        min_length=2,
        max_length=200,
        description="文章标题"
    )
    summary: str | None = Field(
        default=None,
        max_length=500,
        description="文章摘要"
    )
    body: str | None = Field(
        default=None,
        min_length=1,
        description="文章正文"
    )
    status: ArticleStatus | None = Field(
        default=None,
        description="文章状态"
    )

    @model_validator(mode="after")
    def validate_changes(self) -> Self:
        if not self.model_fields_set:
            raise ValueError(
                "至少提供一个需要修改的字段"
            )

        null_fields = [
            field_name
            for field_name in self.model_fields_set
            if getattr(self, field_name) is None
        ]

        if null_fields:
            raise ValueError(
                "修改字段不能为 null"
            )

        return self