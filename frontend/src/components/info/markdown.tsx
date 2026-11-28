import type { ReactNode } from "react";
import ReactMarkdown, { type Components } from "react-markdown";
import { slugify } from "@/lib/slug";

const SAFE_PROTOCOL = /^(https?:|mailto:|tel:)/i;

/**
 * Keeps only http(s), mailto, tel, relative and anchor URLs; anything else (javascript:,
 * vbscript:, data:, …) becomes an empty string and the link is rendered without an href.
 */
export function safeUrl(url: string): string {
  const value = url.trim();
  if (value.startsWith("#") || value.startsWith("/") || SAFE_PROTOCOL.test(value)) {
    return value;
  }
  return /^[a-z][a-z0-9+.-]*:/i.test(value) ? "" : value;
}

function textOf(children: ReactNode): string {
  if (typeof children === "string" || typeof children === "number") {
    return String(children);
  }
  if (Array.isArray(children)) {
    return children.map(textOf).join("");
  }
  if (children && typeof children === "object" && "props" in children) {
    return textOf((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

/** `## Title` lines of a Markdown text, for the table of contents (same ids as the renderer). */
export function markdownHeadings(markdown: string): { id: string; title: string }[] {
  return markdown
    .split(/\r?\n/)
    .filter((line) => /^##\s+\S/.test(line))
    .map((line) =>
      line
        .replace(/^##\s+/, "")
        .replace(/[*_`]/g, "")
        .trim(),
    )
    .map((title) => ({ id: slugify(title), title }));
}

const components: Components = {
  // Headings move down one level so the page keeps its single h1.
  h1: ({ children }) => <h2 className="text-h3 text-text mt-8">{children}</h2>,
  h2: ({ children }) => (
    <h2 id={slugify(textOf(children))} className="text-h3 text-text mt-8 scroll-mt-24">
      {children}
    </h2>
  ),
  h3: ({ children }) => <h3 className="text-h4 text-text mt-6">{children}</h3>,
  h4: ({ children }) => <h4 className="text-body text-text mt-4 font-semibold">{children}</h4>,
  h5: ({ children }) => <h5 className="text-body text-text mt-4 font-semibold">{children}</h5>,
  h6: ({ children }) => <h6 className="text-body text-text mt-4 font-semibold">{children}</h6>,
  a: ({ href, children }) => {
    if (!href) {
      return <span>{children}</span>;
    }
    const external = /^https?:/i.test(href);
    return (
      <a
        href={href}
        className="text-accent hover:text-accent-hover focus-visible:focus-ring rounded-sm underline"
        {...(external ? { target: "_blank", rel: "noopener noreferrer nofollow" } : {})}
      >
        {children}
        {external ? <span className="sr-only"> (tab baru)</span> : null}
      </a>
    );
  },
};

/**
 * Markdown from settings, rendered on the server. Raw HTML is skipped (never rendered), images
 * are dropped and unsafe URLs are removed, so admin-edited text cannot inject markup or scripts.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <ReactMarkdown
      skipHtml
      disallowedElements={["img"]}
      unwrapDisallowed={false}
      urlTransform={safeUrl}
      components={components}
    >
      {children}
    </ReactMarkdown>
  );
}
