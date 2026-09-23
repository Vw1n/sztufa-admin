import { authenticatedRequest, buildAuthHeaders, parseResponse, BASE_URL } from "./core";
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
  return authenticatedRequest<T>(
    `/admin/members${path}`,
    {
      method,
      ...(body ? { body: JSON.stringify(body) } : {}),
    },
  );
}
export async function cardPreview(memberId: string, assetId: string) {
  const response = await fetch(
    `${BASE_URL}/admin/members/${memberId}/cards/${assetId}`,
    { headers: buildAuthHeaders(), cache: "no-store" },
  );
  if (!response.ok) {
    await parseResponse(response);
    throw new Error("材料不可查看");
  }
  return response.blob();
}
