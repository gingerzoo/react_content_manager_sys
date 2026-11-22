const CONTENT_SERVICE_URL = (
    process.env.CONTENT_SERVICE_URL ||
    'http://127.0.0.1:8000'
).replace(/\/+$/, '');

/**
 * 在内容服务中搜索已发布文章。
 *
 * @param {string} keyword - 已校验并去除首尾空白的关键词。
 * @returns {Promise<{
 *   items: Array<{
 *     id: number,
 *     title: string,
 *     summary: string
 *   }>,
 *   hasMore: boolean
 * }>} 最多五篇文章摘要及是否还有更多结果。
 * @throws {Error} 内容服务请求失败或返回格式错误时抛出。
 */
async function searchPublishedContents(keyword) {
    const searchParams = new URLSearchParams({
        keyword,
        limit: '6'
    });

    const response = await fetch(
        `${CONTENT_SERVICE_URL}/articles?${searchParams}`,
        {
            signal: AbortSignal.timeout(5000)
        }
    );

    if (!response.ok) {
        throw new Error(
            `内容服务搜索失败：HTTP ${response.status}`
        );
    }

    const result = await response.json();

    if (
        typeof result !== 'object' ||
        result === null ||
        !Array.isArray(result.list) ||
        !Number.isSafeInteger(result.total)
    ) {
        throw new Error(
            '内容服务搜索结果格式不正确'
        );
    }

    return {
        items: result.list.slice(0, 5),
        hasMore: result.total > 5
    };
}

/**
 * 通过内容服务读取一篇已发布文章。
 *
 * @param {number} id - 已校验的文章数据库 ID。
 * @returns {Promise<{
 *   id: number,
 *   title: string,
 *   summary: string,
 *   body: string
 * } | null>} 文章内容；不存在、未发布或已删除时返回 null。
 * @throws {Error} 内容服务请求失败或返回格式错误时抛出。
 */
async function findPublishedContentById(id) {
    const response = await fetch(
        `${CONTENT_SERVICE_URL}/articles/${id}`,
        {
            signal: AbortSignal.timeout(5000)
        }
    );

    if (response.status === 404) {
        return null;
    }

    if (!response.ok) {
        throw new Error(
            `内容服务详情请求失败：HTTP ${response.status}`
        );
    }

    const article = await response.json();

    if (
        typeof article !== 'object' ||
        article === null ||
        !Number.isSafeInteger(article.id) ||
        typeof article.title !== 'string' ||
        typeof article.summary !== 'string' ||
        typeof article.body !== 'string'
    ) {
        throw new Error(
            '内容服务详情返回格式不正确'
        );
    }

    return article;
}

module.exports = {
    searchPublishedContents,
    findPublishedContentById
};