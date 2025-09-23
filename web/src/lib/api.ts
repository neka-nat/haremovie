/* eslint-disable @typescript-eslint/no-explicit-any */
export type ServerTaskStatus = "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";

type ImageData = { base64_data: string; mime_type: string };

export interface CreateTaskRequest {
  bride_image: ImageData;
  groom_image: ImageData;
  dress_image: ImageData;
  tuxedo_image: ImageData;
  background_image: ImageData;
}

export interface CreateTaskResponse {
  task_id: string;
}

export interface Task {
  id: string;
  status: ServerTaskStatus;
  progress?: number;
  created_at?: string;
  updated_at?: string;
}

export interface TaskResult {
  id: string;
  task_id: string;
  result_video_url: string;
  created_at?: string;
  updated_at?: string;
}

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:8000";

const endpoints = {
  createTask: () => `${API_BASE_URL}/tasks/create`,
  getTask: (id: string) => `${API_BASE_URL}/tasks/${id}`,
  getTaskResult: (id: string) => `${API_BASE_URL}/tasks/${id}/result`,
};

async function postJson<T>(url: string, body: any): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body ?? {}),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`POST ${url} failed (${res.status}): ${text}`);
  }
  return res.json() as Promise<T>;
}

export async function createTask(req: CreateTaskRequest): Promise<CreateTaskResponse> {
  return postJson<CreateTaskResponse>(endpoints.createTask(), req);
}

// バックエンドが POST でルート定義されているため POST を使う
export async function getTask(taskId: string): Promise<Task> {
  return postJson<Task>(endpoints.getTask(taskId), {});
}

export async function getTaskResult(taskId: string): Promise<TaskResult> {
  return postJson<TaskResult>(endpoints.getTaskResult(taskId), {});
}

// ---------- 画像ヘルパー ----------

function dataUrlToBase64(dataUrl: string): { base64: string; mime: string } {
  const [header, data] = dataUrl.split(",", 2);
  const mimeMatch = header.match(/^data:(.*?);base64$/);
  const mime = mimeMatch?.[1] || "application/octet-stream";
  return { base64: data, mime };
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Failed to read blob"));
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });
}

// File または URL(string) を Base64(プレフィックス無)と MIME に
export async function fileOrUrlToBase64(
  input: File | string
): Promise<{ base64: string; mime: string }> {
  if (typeof input !== "string") {
    // File
    const dataUrl = await blobToDataUrl(input);
    return dataUrlToBase64(dataUrl);
  }
  // string URL（Vite のアセット path を含む）
  const resp = await fetch(input);
  if (!resp.ok) throw new Error(`Failed to fetch asset: ${input} (${resp.status})`);
  const blob = await resp.blob();
  const dataUrl = await blobToDataUrl(blob);
  // blob.type は空のこともあるため dataURL から確実に MIME を拾う
  return dataUrlToBase64(dataUrl);
}
