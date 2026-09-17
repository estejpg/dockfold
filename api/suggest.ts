import {
  HttpError,
  jsonBody,
  privateHeaders,
  validateOrigin,
} from "../server/http.js";
import {
  parseSuggestion,
  SuggestionError,
  suggestionMailto,
  suggestionText,
} from "../src/lib/suggestion.js";

const inbox = () => process.env.SUGGESTION_INBOX?.trim() || "";

async function sendEmail(text: string, title: string) {
  const key = process.env.RESEND_API_KEY?.trim();
  const from = process.env.RESEND_FROM?.trim();
  const to = inbox();
  if (!key || !from || !to) return false;
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Dock suggestion: ${title}`,
      text,
    }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new HttpError("The suggestion could not be sent.", 503);
  return true;
}

export async function handler(request: Request) {
  try {
    if (request.method !== "POST")
      return Response.json(
        { error: "This action is unavailable." },
        { status: 405, headers: { ...privateHeaders, Allow: "POST" } },
      );
    validateOrigin(request);
    const suggestion = parseSuggestion(await jsonBody(request));
    const text = suggestionText(suggestion);
    if (await sendEmail(text, suggestion.title))
      return Response.json(
        { delivered: "email", text },
        { headers: privateHeaders },
      );
    const to = inbox();
    return Response.json(
      {
        delivered: to ? "mailto" : "copy",
        text,
        ...(to ? { mailto: suggestionMailto(to, suggestion) } : {}),
      },
      { headers: privateHeaders },
    );
  } catch (error) {
    if (error instanceof SuggestionError)
      return Response.json(
        { error: error.message },
        { status: 400, headers: privateHeaders },
      );
    if (error instanceof HttpError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers: privateHeaders },
      );
    console.error(
      "Suggestion request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
      { error: "We couldn’t send that suggestion. Please try again." },
      { status: 503, headers: privateHeaders },
    );
  }
}
export default { fetch: handler };
