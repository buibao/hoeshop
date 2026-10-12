import Markdown from "react-markdown";
import type { Components } from "react-markdown";
import { StoreTextReveal, StoreTextExemption } from "./ui/StoreTextReveal";

const components: Components = {
  h1: ({ children }) => <StoreTextReveal as="h1" role="heading">{children}</StoreTextReveal>,
  h2: ({ children }) => <StoreTextReveal as="h2" role="heading">{children}</StoreTextReveal>,
  h3: ({ children }) => <StoreTextReveal as="h3" role="heading">{children}</StoreTextReveal>,
  h4: ({ children }) => <StoreTextReveal as="h4" role="heading">{children}</StoreTextReveal>,
  p: ({ children }) => <StoreTextReveal as="p">{children}</StoreTextReveal>,
  ul: ({ children }) => <StoreTextExemption><ul>{children}</ul></StoreTextExemption>,
  ol: ({ children }) => <StoreTextExemption><ol>{children}</ol></StoreTextExemption>,
  table: ({ children }) => <StoreTextExemption><table>{children}</table></StoreTextExemption>,
};

/** Markdown retains its inline tree; paragraphs, not entire articles, are units. */
export function StoreProse({ children }: { children: string }) {
  return <Markdown skipHtml components={components}>{children}</Markdown>;
}
