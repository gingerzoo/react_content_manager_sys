USE my_project;
SET NAMES utf8mb4;
-- 内容库：为 Agent 的文章搜索和详情读取提供真实业务数据。
CREATE TABLE IF NOT EXISTS contents (
    id INT PRIMARY KEY AUTO_INCREMENT
        COMMENT '文章主键',

    title VARCHAR(200) NOT NULL
        COMMENT '文章标题',

    summary VARCHAR(500) NOT NULL DEFAULT ''
        COMMENT '文章摘要，供搜索结果展示',

    body MEDIUMTEXT NOT NULL
        COMMENT '文章正文，可存储 Markdown',

    status ENUM('draft', 'published') NOT NULL DEFAULT 'draft'
        COMMENT 'draft=草稿，published=已发布',

    created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        COMMENT '创建时间',

    updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
        ON UPDATE CURRENT_TIMESTAMP
        COMMENT '最后更新时间',
    deleted_at DATETIME NULL DEFAULT NULL
        COMMENT '软删除时间，NULL 表示未删除',

    INDEX idx_contents_status_id (status, id),

    INDEX idx_contents_deleted_status_id (
        deleted_at,
        status,
        id
)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;