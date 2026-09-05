import { identity, requireReviewer } from "../server/auth.js";
import {
  HttpError,
  jsonBody,
  privateHeaders,
  textField,
  uuid,
  validateOrigin,
} from "../server/http.js";
import * as community from "../server/community-service.js";

function iconId(value: unknown) {
  if (typeof value !== "string" || !/^[a-f0-9]{64}$/.test(value))
    throw new HttpError("Choose a valid icon.");
  return value;
}
export async function handler(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get("action") || "board";
    const getActions = [
      "board",
      "catalog",
      "me",
      "review",
      "private-icon",
      "targets",
    ];
    const postActions = [
      "request",
      "vote",
      "review-status",
      "merge",
      "publish",
      "decline-icon",
      "visibility",
    ];
    if (
      !(
        request.method === "GET"
          ? getActions
          : request.method === "POST"
            ? postActions
            : []
      ).includes(action)
    )
      return Response.json(
        { error: "This action is unavailable." },
        {
          status: 405,
          headers: {
            ...privateHeaders,
            Allow: getActions.includes(action) ? "GET" : "POST",
          },
        },
      );
    if (!process.env.DATABASE_URL)
      throw new HttpError(
        "Community submissions are temporarily unavailable. Please try again later.",
        503,
      );
    const offset = Number(url.searchParams.get("offset") || "0");
    if (!Number.isInteger(offset) || offset < 0 || offset > 5000)
      throw new HttpError("Choose a valid page.");
    let result: unknown;
    if (request.method === "GET") {
      if (action === "board")
        result = await community.listBoard(
          textField(url.searchParams.get("q") || "", "search", 80, false),
          offset,
        );
      else if (action === "catalog")
        result = { apps: await community.listCatalog() };
      else if (action === "me") {
        const user = await identity(request);
        result = {
          reviewer: user.reviewer,
          votes: await community.ownVotes(user.userId),
        };
      } else {
        await requireReviewer(request);
        if (action === "private-icon") {
          const file = await community.privateIcon(
            iconId(url.searchParams.get("id")),
          );
          return new Response(file.stream, {
            headers: {
              ...privateHeaders,
              "Content-Type": "image/png",
              "Content-Disposition": "inline; filename=icon.png",
            },
          });
        }
        const status = url.searchParams.get("status") || "pending";
        if (
          !["pending", "open", "included", "declined", "merged"].includes(
            status,
          )
        )
          throw new HttpError("Choose a review status.");
        result =
          action === "targets"
            ? await community.listTargets(
                textField(url.searchParams.get("q") || "", "search", 80, false),
              )
            : await community.listReview(status, offset);
      }
    } else {
      validateOrigin(request);
      const body = await jsonBody(request);
      if (action === "request") {
        await community.limitWrites(request);
        result = await community.addRequest(body);
      } else if (action === "vote") {
        const user = await identity(request);
        if (typeof body.voted !== "boolean")
          throw new HttpError("Choose whether to add or remove your vote.");
        await community.limitWrites(request, user.userId);
        result = await community.saveVote(
          uuid(body.id),
          user.userId,
          body.voted,
        );
      } else {
        await requireReviewer(request);
        if (action === "review-status") {
          if (body.status !== "open" && body.status !== "declined")
            throw new HttpError("Choose a valid review status.");
          result = await community.reviewStatus(
            uuid(body.id),
            body.revision,
            body.status,
          );
        } else if (action === "merge")
          result = await community.mergeRequests(
            uuid(body.id),
            uuid(body.targetId),
            body.revision,
          );
        else if (action === "publish")
          result = await community.publishIcon(
            uuid(body.id),
            iconId(body.iconId),
            body.revision,
            body.category,
          );
        else if (action === "decline-icon")
          result = await community.declineIcon(iconId(body.iconId));
        else if (action === "visibility") {
          if (
            typeof body.active !== "boolean" ||
            typeof body.id !== "string" ||
            !body.id.startsWith("community-")
          )
            throw new HttpError("Choose a valid catalog app.");
          uuid(body.id.slice(10));
          result = await community.setVisibility(body.id, body.active);
        }
      }
    }
    return Response.json(result, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof HttpError)
      return Response.json(
        { error: error.message },
        { status: error.status, headers: privateHeaders },
      );
    console.error(
      "Community request failed",
      error instanceof Error ? error.name : "UnknownError",
    );
    return Response.json(
      { error: "We couldn’t complete that request. Please try again." },
      { status: 503, headers: privateHeaders },
    );
  }
}
export default { fetch: handler };
