const pool = require('../db');

/**
 * 在已发布文章的标题和摘要中搜索关键词。
 * 查询最多 6 条，返回前 5 条，额外一条用于判断是否还有结果。
 *
 * @param {string} keyword - 已校验并去除首尾空白的关键词。
 * @returns {Promise<{
 *   items: Array<{id: number, title: string, summary: string}>,
 *   hasMore: boolean
 * }>} 文章摘要列表及是否存在更多结果；不返回正文。
 * @throws {Error} 数据库查询失败时向调用方传播。
 */
async function searchPublishedContents(keyword) {
    const [rows] = await pool.execute(
        `SELECT id, title, summary
         FROM contents
         WHERE status = 'published'
           AND (
               LOCATE(?, title) > 0
               OR LOCATE(?, summary) > 0
           )
         ORDER BY id DESC
         LIMIT 6`,
        [keyword, keyword]
    );

    return {
        items: rows.slice(0, 5),
        hasMore: rows.length > 5
    };
}

/**
 * 根据 ID 查询一篇已发布文章。
 * 正文最多读取 12001 个字符，多读一个用于判断是否需要截断。
 *
 * @param {number} id - 已校验的文章数据库 ID。
 * @returns {Promise<{
 *   id: number,
 *   title: string,
 *   summary: string,
 *   body: string
 * } | null>} 文章数据；不存在或未发布时返回 null。
 * @throws {Error} 数据库查询失败时向上传播。
 */
async function findPublishedContentById(id) {
    const [rows] = await pool.execute(
        `SELECT
            id,
            title,
            summary,
            LEFT(body, 12001) AS body
         FROM contents
         WHERE id = ?
           AND status = 'published'
         LIMIT 1`,
        [id]
    );

    return rows[0] || null;
}

module.exports = {
    searchPublishedContents,
    findPublishedContentById
};