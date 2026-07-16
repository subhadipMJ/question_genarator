declare module "sanitize-html" {
    type SanitizeOptions = {
        allowedTags?: string[];
    };

    type SanitizeHtml = {
        (html: string, options?: SanitizeOptions): string;
        defaults: {
            allowedTags: string[];
        };
    };

    const sanitizeHtml: SanitizeHtml;
    export default sanitizeHtml;
}
