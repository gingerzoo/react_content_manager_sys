import os
from pathlib import Path

from dotenv import load_dotenv


PROJECT_ROOT = (
    Path(__file__)
    .resolve()
    .parents[2]
)

load_dotenv(
    PROJECT_ROOT / ".env"
)


class Settings:
    def __init__(self):
        self.db_host = os.getenv(
            "DB_HOST",
            "127.0.0.1"
        )
        self.db_port = int(
            os.getenv(
                "DB_PORT",
                "13306"
            )
        )
        self.db_name = os.getenv(
            "DB_NAME",
            "my_project"
        )
        self.db_user = os.getenv(
            "DB_USER",
            "content_app"
        )
        self.db_password = os.getenv(
            "DB_PASSWORD",
            ""
        )
        self.db_pool_size = int(
            os.getenv(
                "DB_POOL_SIZE",
                "5"
            )
        )

        if not self.db_password:
            raise RuntimeError(
                "缺少 DB_PASSWORD 环境变量"
            )


settings = Settings()