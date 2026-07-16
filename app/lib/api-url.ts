export function getApiUrl(path: string): string {
    const apiUrl = process.env.API_URL;

    if (!apiUrl) {
        throw new Error("API_URL is not configured");
    }

    const baseUrl = apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
    return new URL(path.replace(/^\//, ""), baseUrl).toString();
}
