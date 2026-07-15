export async function getAllQuestions() {
    const apiUrl = process.env.QUESTIONS_API_URL;

    if (!apiUrl) {
        throw new Error("QUESTIONS_API_URL is not configured");
    }

    const response = await fetch(apiUrl, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    return response.json();
}
