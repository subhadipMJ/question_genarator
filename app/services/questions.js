export async function getAllQuestions() {
    const apiUrl = getQuestionsApiUrl();

    const response = await fetch(apiUrl, {
        cache: "no-store",
    });

    if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
    }

    return response.json();
}

export async function createQuestion(data) {
    const response = await fetch(getQuestionsApiUrl(), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to create question");
}

export async function createQuestionOption(questionId, data) {
    const optionsUrl = new URL(`${questionId}/options/`, getQuestionsApiUrl());
    const response = await fetch(optionsUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
    });

    return readApiResponse(response, "Failed to create option");
}

function getQuestionsApiUrl() {
    const apiUrl = process.env.QUESTIONS_API_URL;

    if (!apiUrl) {
        throw new Error("QUESTIONS_API_URL is not configured");
    }

    return apiUrl.endsWith("/") ? apiUrl : `${apiUrl}/`;
}

async function readApiResponse(response, fallbackMessage) {
    if (!response.ok) {
        const error = await response.json().catch(() => null);
        const detail = typeof error?.detail === "string" ? error.detail : null;
        throw new Error(detail ?? `${fallbackMessage}: ${response.status}`);
    }

    return response.json();
}
