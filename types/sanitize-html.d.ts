declare module "sanitize-html" {
    type SanitizeOptions = {
        allowedTags?: string[];
        allowedAttributes?: Record<string, string[]>;
        disallowedTagsMode?: string;
    };

    type SanitizeHtml = {
        (html: string, options?: SanitizeOptions): string;
        defaults: {
            allowedTags: string[];
            allowedAttributes: Record<string, string[]>;
        };
    };

    const sanitizeHtml: SanitizeHtml;
    export default sanitizeHtml;
}
