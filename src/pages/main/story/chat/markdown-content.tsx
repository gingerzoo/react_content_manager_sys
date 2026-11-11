import { memo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownContentProps {
    content: string;
}

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