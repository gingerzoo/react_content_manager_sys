from fastapi import (
    FastAPI,
    HTTPException,
    Request
)
from fastapi.exceptions import (
    RequestValidationError
)
from fastapi.responses import JSONResponse
from mysql.connector import Error as MySQLError
from app.db.mysql import get_connection
import logging
from http import HTTPStatus

from app.routers.articles import (
    router as articles_router
)


app = FastAPI(
    title="内容服务",
    version="1.0.0"
)

logger = logging.getLogger(__name__)

def create_problem_response(
    request: Request,
    status: int,
    title: str,
    detail: str,
    problem_type: str = "about:blank",
    errors: list[dict] | None = None
):
    content = {
        "type": problem_type,
        "title": title,
        "status": status,
        "detail": detail,
        "instance": request.url.path
    }

    if errors is not None:
        content["errors"] = errors

    return JSONResponse(
        status_code=status,
        content=content,
        media_type="application/problem+json"
    )


@app.exception_handler(HTTPException)
async def handle_http_exception(
    request: Request,
    error: HTTPException
):
    try:
        title = HTTPStatus(
            error.status_code
        ).phrase
    except ValueError:
        title = "HTTP Error"

    return create_problem_response(
        request=request,
        status=error.status_code,
        title=title,
        detail=str(error.detail)
    )


@app.exception_handler(RequestValidationError)
async def handle_validation_error(
    request: Request,
    error: RequestValidationError
):
    errors = [
        {
            "location": ".".join(
                str(item)
                for item in detail["loc"]
            ),
            "message": detail["msg"],
            "type": detail["type"]
        }
        for detail in error.errors()
    ]

    return create_problem_response(
        request=request,
        status=422,
        title="Validation Error",
        detail="请求参数校验失败",
        problem_type=(
            "urn:content-service:"
            "problem:validation-error"
        ),
        errors=errors
    )


@app.exception_handler(MySQLError)
async def handle_mysql_error(
    request: Request,
    error: MySQLError
):
    logger.error(
        "数据库操作失败：%s",
        error,
        exc_info=(
            type(error),
            error,
            error.__traceback__
        )
    )

    return create_problem_response(
        request=request,
        status=500,
        title="Internal Server Error",
        detail="数据库操作失败",
        problem_type=(
            "urn:content-service:"
            "problem:database-error"
        )
    )


@app.exception_handler(Exception)
async def handle_unknown_error(
    request: Request,
    error: Exception
):
    logger.error(
        "未处理的服务异常：%s",
        error,
        exc_info=(
            type(error),
            error,
            error.__traceback__
        )
    )

    return create_problem_response(
        request=request,
        status=500,
        title="Internal Server Error",
        detail="服务器内部错误"
    )

app.include_router(articles_router)


@app.get(
    "/health",
    tags=["system"],
    summary="服务健康检查"
)
def health():
    return {
        "status": "ok"
    }

@app.get(
    "/health/db",
    tags=["system"],
    summary="数据库健康检查"
)
def database_health():
    connection = get_connection()

    try:
        cursor = connection.cursor(
            dictionary=True
        )

        try:
            cursor.execute(
                """
                SELECT
                    DATABASE() AS database_name,
                    1 AS connected
                """
            )

            result = cursor.fetchone()

            return {
                "status": "ok",
                "database": result
            }
        finally:
            cursor.close()
    finally:
        connection.close()