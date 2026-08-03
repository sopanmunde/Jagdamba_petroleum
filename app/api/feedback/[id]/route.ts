import { NextResponse } from "next/server";
import { GET as getFeedbacks, DELETE as deleteFeedback, PUT as updateFeedback } from "../route";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  url.searchParams.set("id", id);
  const modifiedRequest = new Request(url.toString(), {
    method: "GET",
    headers: request.headers,
  });
  return getFeedbacks(modifiedRequest);
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const url = new URL(request.url);
  url.searchParams.set("id", id);
  const modifiedRequest = new Request(url.toString(), {
    method: "DELETE",
    headers: request.headers,
  });
  return deleteFeedback(modifiedRequest);
}

export async function PUT(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const body = await request.json().catch(() => ({}));
  const updatedBody = { ...body, id };

  const modifiedRequest = new Request(request.url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(updatedBody),
  });
  return updateFeedback(modifiedRequest);
}
