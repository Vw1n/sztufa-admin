import { BASE_URL, createHeaders, handleResponse } from "./http";
export interface Member {
  id: string;
  username: string;
  nickname?: string;
  realName?: string;
  requestedStudentId?: string;
  studentId?: string;
  verificationStatus: string;
  verificationVersion: number;
  reviewComment?: string;
  disabled: boolean;
  createdAt: string;
  reviewedAt?: string;
  assets?: {
    id: string;
    state: string;
    version: number;
    deleteAfter: string;
    deletedAt?: string;
  }[];
}
export async function memberRequest<T>(
  path = "",
  method = "GET",
  body?: unknown,
): Promise<T> {
  return handleResponse<T>(
    await fetch(`${BASE_URL}/admin/members${path}`, {
      method,
      headers: createHeaders(),
      ...(body ? { body: JSON.stringify(body) } : {}),
    }),
  );
}
export async function cardPreview(memberId: string, assetId: string) {
  const response = await fetch(
    `${BASE_URL}/admin/members/${memberId}/cards/${assetId}`,
    { headers: createHeaders(), cache: "no-store" },
  );
  if (!response.ok) {
    await handleResponse(response);
    throw new Error("材料不可查看");
  }
  return response.blob();
}
