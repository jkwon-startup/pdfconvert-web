"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownPreviewProps {
  markdown: string;
}

export function MarkdownPreview({ markdown }: MarkdownPreviewProps) {
  return (
    <div className="min-h-[300px] max-h-[600px] overflow-auto rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 px-4 py-3 text-sm leading-relaxed">
      <div className="prose prose-sm dark:prose-invert max-w-none break-words [&_table]:my-3 [&_th]:bg-zinc-100 dark:[&_th]:bg-zinc-800 [&_th]:text-left [&_th]:p-2 [&_td]:p-2 [&_th]:border [&_td]:border [&_th]:border-zinc-300 [&_td]:border-zinc-300 dark:[&_th]:border-zinc-700 dark:[&_td]:border-zinc-700 [&_pre]:bg-zinc-100 dark:[&_pre]:bg-zinc-800 [&_pre]:p-3 [&_pre]:rounded [&_code]:text-xs [&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:mt-4 [&_h2]:mb-2 [&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:my-0.5 [&_p]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:border-zinc-300 dark:[&_blockquote]:border-zinc-700 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-zinc-600 dark:[&_blockquote]:text-zinc-400">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
      </div>
    </div>
  );
}
