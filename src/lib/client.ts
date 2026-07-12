"use client";

export async function postJson<T>(url: string, body?: unknown, method = "POST") {
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body === undefined ? undefined : JSON.stringify(body)
  });
  const json = (await response.json()) as { ok: boolean; data?: T; error?: string };

  if (!response.ok || !json.ok) {
    throw new Error(json.error ?? "The operation failed.");
  }

  return json.data as T;
}
