import sanitizeHtml from "sanitize-html";

/**
 * Safely sanitize HTML string for rendering with dangerouslySetInnerHTML.
 * Replaces any <script> tags with &lt;script&gt; so React 19 never encounters an
 * unescaped <script> DOM node, while preserving valid HTML formatting like <sub>, <sup>, <b>, etc.
 */
export function sanitizeHtmlContent(html: string | null | undefined): string {
    if (!html) return "";
    
    // Pre-escape any script tags so browser/React DOM never sees a <script> element node
    const safeHtml = html
        .replace(/<script\b/gi, "&lt;script")
        .replace(/<\/script>/gi, "&lt;/script&gt;");

    return sanitizeHtml(safeHtml, {
        allowedTags: [...sanitizeHtml.defaults.allowedTags, "sub", "sup"],
        disallowedTagsMode: "escape",
    });
}
