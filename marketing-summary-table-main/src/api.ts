const API = "https://functions.poehali.dev/6cab9cd5-93c3-4c92-b04c-f1aba47059b8";

async function request(resource: string, method = "GET", body?: unknown, id?: number | string) {
  const url = new URL(API);
  url.searchParams.set("resource", resource);
  if (id !== undefined) url.searchParams.set("id", String(id));
  const res = await fetch(url.toString(), {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

export const api = {
  get: (resource: string) => request(resource),
  post: (resource: string, body: unknown) => request(resource, "POST", body),
  put: (resource: string, id: number | string, body: unknown) => request(resource, "PUT", body, id),
  delete: (resource: string, id: number | string) => request(resource, "DELETE", undefined, id),
};
