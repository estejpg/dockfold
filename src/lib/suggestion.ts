import { catalog, MAX_APPS } from "./dock";
import { groups } from "./collections";

export const MAX_SUGGESTION_APPS = MAX_APPS;
const catalogIds = new Set(catalog.map((app) => app.id));
const groupIds = new Set(groups.map((group) => group.id));

export type Suggestion = {
  title: string;
  description: string;
  group: string;
  apps: string[];
  notes: string;
  credit: string;
  email: string;
};

export class SuggestionError extends Error {}

function textField(
  value: unknown,
  label: string,
  max: number,
  required = true,
) {
  if (
    typeof value !== "string" ||
    value.length > max ||
    (required && !value.trim()) ||
    [...value].some(
      (char) =>
        (char.charCodeAt(0) < 32 &&
          ![9, 10, 13].includes(char.charCodeAt(0))) ||
        char.charCodeAt(0) === 127,
    )
  )
    throw new SuggestionError(`Check the ${label} and try again.`);
  return value.trim();
}

export function parseSuggestion(value: unknown): Suggestion {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new SuggestionError("The form couldn’t be read.");
  const body = value as Record<string, unknown>;
  if (body.company)
    throw new SuggestionError("Please leave the empty field blank.");
  const title = textField(body.title, "Dock name", 60);
  const description = textField(body.description, "description", 180);
  const group = textField(body.group, "category", 40);
  if (!groupIds.has(group))
    throw new SuggestionError("Choose a category from the list.");
  if (!Array.isArray(body.apps) || body.apps.length === 0)
    throw new SuggestionError("Choose at least one app.");
  if (body.apps.length > MAX_SUGGESTION_APPS)
    throw new SuggestionError(`Choose up to ${MAX_SUGGESTION_APPS} apps.`);
  if (
    !body.apps.every(
      (id) => typeof id === "string" && catalogIds.has(id),
    ) ||
    new Set(body.apps).size !== body.apps.length
  )
    throw new SuggestionError("Choose apps from the DockFold catalog.");
  const notes = textField(body.notes ?? "", "notes", 1000, false);
  const credit = textField(body.credit ?? "", "credit", 80, false);
  const email = textField(body.email ?? "", "email", 200, false);
  if (
    email &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  )
    throw new SuggestionError("Check the email address and try again.");
  return {
    title,
    description,
    group,
    apps: body.apps as string[],
    notes,
    credit,
    email,
  };
}

export function suggestionText(suggestion: Suggestion) {
  const names = suggestion.apps
    .map((id) => catalog.find((app) => app.id === id)?.name ?? id)
    .join(", ");
  const groupName =
    groups.find((group) => group.id === suggestion.group)?.name ??
    suggestion.group;
  return [
    `Name: ${suggestion.title}`,
    `Category: ${groupName}`,
    `Description: ${suggestion.description}`,
    `Apps: ${names}`,
    `App IDs: ${suggestion.apps.join(", ")}`,
    suggestion.credit ? `Credit: ${suggestion.credit}` : "",
    suggestion.email ? `Email: ${suggestion.email}` : "",
    suggestion.notes ? `Notes:\n${suggestion.notes}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export function suggestionMailto(inbox: string, suggestion: Suggestion) {
  const subject = `Dock suggestion: ${suggestion.title}`;
  const body = suggestionText(suggestion);
  return `mailto:${encodeURIComponent(inbox)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
