import DOMPurify from 'dompurify';

/** Renders ticket message: HTML (sanitized) or plain text */
const isHtml = (text: string) => typeof text === 'string' && text.trim().startsWith('<') && (text.includes('</') || text.includes('/>'));

interface MessageContentProps {
    message: string;
    className?: string;
    /** Use for support/reply bubbles (dark background) – forces light readable text */
    light?: boolean;
}

const MessageContent = ({ message, className = '', light = false }: MessageContentProps) => {
    if (!message) return null;
    const trimmed = message.trim();
    if (!trimmed) return null;

    if (isHtml(trimmed)) {
        const sanitized = DOMPurify.sanitize(trimmed, {
            ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'h1', 'h2', 'h3', 'ul', 'ol', 'li', 'a'],
            ALLOWED_ATTR: ['href', 'target', 'rel'],
        });
        const proseClass = light
            ? 'prose prose-sm prose-invert max-w-none !text-white [&_p]:!text-white [&_a]:!text-white [&_strong]:!text-white [&_em]:!text-white [&_u]:!text-white [&_h1]:!text-white [&_h2]:!text-white [&_h3]:!text-white [&_li]:!text-white [&_ul]:!text-white [&_ol]:!text-white [&_a]:underline [&_a]:underline-offset-2'
            : 'prose prose-sm dark:prose-invert max-w-none';
        return (
            <div
                className={`message-content ${proseClass} ${className}`}
                dangerouslySetInnerHTML={{ __html: sanitized }}
            />
        );
    }

    return <p className={`whitespace-pre-wrap ${className}`}>{message}</p>;
};

export default MessageContent;
