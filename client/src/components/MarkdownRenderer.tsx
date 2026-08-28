import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export default function MarkdownRenderer({ content, className = "" }: MarkdownRendererProps) {
  if (!content) return null;

  return (
    <div className={`markdown-body text-slate-700 leading-relaxed text-sm sm:text-base ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 mt-7 mb-3 pb-1 border-b border-slate-200">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 mt-6 mb-2.5 flex items-center gap-2">
              <span className="w-1.5 h-4.5 bg-[#0f2445] rounded-full inline-block" />
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base sm:text-lg font-bold text-slate-800 mt-5 mb-2">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-sm sm:text-base font-bold text-slate-800 mt-4 mb-1.5">
              {children}
            </h4>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-slate-700 leading-relaxed last:mb-0">
              {children}
            </p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-slate-900 bg-amber-50/70 px-0.5 rounded">
              {children}
            </strong>
          ),
          em: ({ children }) => (
            <em className="italic text-slate-800">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[#0f2445] bg-slate-50/90 py-3 px-4 rounded-r-xl my-4 text-slate-700 italic shadow-2xs">
              {children}
            </blockquote>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-outside pl-5 space-y-1.5 mb-4 text-slate-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-outside pl-5 space-y-1.5 mb-4 text-slate-700 font-medium">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          img: ({ src, alt }) => (
            <figure className="my-6">
              <img
                src={src}
                alt={alt || "Article Image"}
                className="w-full max-h-[500px] object-cover rounded-2xl border border-slate-200/80 shadow-xs"
                loading="lazy"
              />
              {alt && (
                <figcaption className="text-center text-xs text-slate-400 mt-2 italic">
                  {alt}
                </figcaption>
              )}
            </figure>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0f2445] underline font-medium hover:text-blue-700 transition-colors"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-slate-200" />,
          table: ({ children }) => (
            <div className="overflow-x-auto my-5 rounded-xl border border-slate-200 shadow-2xs">
              <table className="w-full text-xs sm:text-sm text-left">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
              {children}
            </thead>
          ),
          th: ({ children }) => <th className="p-3">{children}</th>,
          td: ({ children }) => (
            <td className="p-3 border-b border-slate-100 last:border-0">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
