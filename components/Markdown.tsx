import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

export function Markdown({ markdown }: { markdown: string }) {
  return (
    <div className="prose-table">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  );
}
