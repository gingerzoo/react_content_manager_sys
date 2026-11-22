from mysql.connector.pooling import (
    MySQLConnectionPool
)

from app.core.config import settings


connection_pool = MySQLConnectionPool(
    pool_name="content_service_pool",
    pool_size=settings.db_pool_size,
    pool_reset_session=True,
    host=settings.db_host,
    port=settings.db_port,
    database=settings.db_name,
    user=settings.db_user,
    password=settings.db_password,
    charset="utf8mb4"
)


def get_connection():
    return connection_pool.get_connection()