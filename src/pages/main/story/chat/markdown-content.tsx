import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
    content: string;
}

/**
 * 将助手文本渲染为 React Markdown 元素；remark-gfm 支持表格、删除线、任务列表等。
 * 流式累计文本会重复解析；未启用原始 HTML，避免直接执行模型输出的 HTML。
 *
 * @param {MarkdownContentProps} props - Markdown 展示配置。
 * @param {string} props.content - 助手累计文本或已保存的完整回复。
 * @returns {import("react").ReactElement} 安全解析 Markdown 后的展示元素。
 */
const MarkdownContent = ({
    content
}: MarkdownContentProps) => {
    return (
        <div className='markdown-content'>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {content}
            </ReactMarkdown>
        </div>
    );
};

export default memo(MarkdownContent);
