import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ChatMarkdownProps {
  content: string;
}

export function ChatMarkdown({ content }: ChatMarkdownProps) {
  return (
    <div className="chat-markdown">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => (
            <p className="m-0 leading-relaxed break-words text-zinc-200 text-sm md:text-base" {...props} />
          ),
          img: ({ node, alt, ...props }) => (
            <img
              alt={alt}
              className="max-h-24 w-auto object-contain rounded-md my-1 bg-transparent select-none"
              loading="lazy"
              {...props}
            />
          ),
          a: ({ node, ...props }) => (
            <a
              className="text-red-400 hover:text-red-300 underline hover:no-underline transition-colors break-all"
              target="_blank"
              rel="noopener noreferrer"
              {...props}
            />
          ),
          code: ({ node, inline, className, children, ...props }: any) => {
            const match = /language-(\w+)/.exec(className || '');
            return !inline ? (
              <pre className="bg-black/50 border border-zinc-800 p-3 rounded-md overflow-x-auto my-2 text-xs font-mono text-zinc-300">
                <code className={className} {...props}>
                  {children}
                </code>
              </pre>
            ) : (
              <code className="bg-zinc-800 text-red-300 px-1.5 py-0.5 rounded font-mono text-xs" {...props}>
                {children}
              </code>
            );
          },
          ul: ({ node, ...props }) => <ul className="list-disc ml-5 mb-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal ml-5 mb-1" {...props} />,
          li: ({ node, ...props }) => <li className="mb-1" {...props} />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
