// @jest-environment jsdom
import React, { act } from "react";
import { beforeEach, describe, it, expect, jest } from "@jest/globals";
import { createRoot } from "react-dom/client";
import MemberAccountsPage from "./MemberAccountsPage";
import { memberRequest, cardPreview } from "../../api/members";
jest.mock("../../api/members", () => ({
  memberRequest: jest.fn(),
  cardPreview: jest.fn(),
}));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
describe("网页用户审核页面", () => {
  beforeEach(() => { jest.clearAllMocks(); });
  it("默认进入待审核队列，可切换已通过和全部用户", async () => {
    (memberRequest as any).mockResolvedValue({ data: [], total: 0 });
    const host = document.createElement("div");
    const root = createRoot(host);
    try {
      await act(async () => root.render(<MemberAccountsPage />));
      expect(memberRequest).toHaveBeenLastCalledWith(expect.stringContaining("&status=PENDING"));
      expect(host.querySelector('[aria-pressed="true"]')?.textContent).toBe("待审核");
      expect(host.textContent).toContain("暂无待审核申请");
      const click = async (label: string) => {
        await act(async () => [...host.querySelectorAll('nav button')].find(button => button.textContent === label)!.dispatchEvent(new MouseEvent('click', { bubbles: true })));
      };
      await click("已通过");
      expect(memberRequest).toHaveBeenLastCalledWith(expect.stringContaining("&status=APPROVED"));
      await click("全部用户");
      expect(memberRequest).toHaveBeenLastCalledWith("?page=1&limit=20&search=");
    } finally { await act(async () => root.unmount()); }
  });
  it("开始审核直接聚焦审核区，填写原因后才可退回补充", async () => {
    const pending = { id: 'm1', username: 'student', verificationStatus: 'PENDING', verificationVersion: 3, disabled: false, createdAt: '2026-08-27', assets: [] };
    (memberRequest as any).mockImplementation(async (path: string) => path.includes('/review') ? { ...pending, verificationStatus: 'CHANGES_REQUESTED', reviewComment: '请重新上传清晰校园卡' } : path === '/m1' ? pending : { data: [pending], total: 1 });
    const host = document.createElement('div');
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<MemberAccountsPage />));
      await act(async () => [...host.querySelectorAll('button')].find(button => button.textContent === '开始审核')!.click());
      const panel = host.querySelector('[aria-label="用户审核详情"]')!;
      expect(document.activeElement).toBe(panel);
      expect(panel.compareDocumentPosition(host.querySelector('table')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
      const reject = [...panel.querySelectorAll('button')].find(button => button.textContent === '退回补充')!;
      expect(reject.disabled).toBe(true);
      await act(async () => {
        const textarea = panel.querySelector('textarea')!;
        Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value')!.set!.call(textarea, '请重新上传清晰校园卡');
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
      });
      expect(reject.disabled).toBe(false);
      await act(async () => reject.click());
      expect(memberRequest).toHaveBeenCalledWith('/m1/review', 'PATCH', { decision: 'CHANGES_REQUESTED', version: 3, reason: '请重新上传清晰校园卡' });
      expect(panel.textContent).toContain('需补充材料');
      expect(panel.textContent).toContain('请重新上传清晰校园卡');
    } finally { await act(async () => root.unmount()); host.remove(); }
  });
  it.each([
    ["没有材料", []],
    [
      "材料过期",
      [
        {
          id: "a1",
          version: 1,
          state: "READY",
          deleteAfter: "2020-01-01T00:00:00Z",
        },
      ],
    ],
    [
      "材料版本不一致",
      [
        {
          id: "a1",
          version: 2,
          state: "READY",
          deleteAfter: "2099-01-01T00:00:00Z",
        },
      ],
    ],
  ])("%s时不能预览或通过审核", async (_label, assets) => {
    const pending = {
      id: "m1",
      username: "student",
      verificationStatus: "PENDING",
      verificationVersion: 1,
      disabled: false,
      createdAt: "2026-08-27T00:00:00Z",
      assets,
    };
    (memberRequest as any).mockImplementation(async (path: string) =>
      path === "/m1" ? pending : { data: [pending], total: 1 },
    );
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    try {
      await act(async () => root.render(<MemberAccountsPage />));
      await act(async () =>
        [...host.querySelectorAll("button")]
          .find((button) => button.textContent?.includes("开始审核"))!
          .click(),
      );
      const buttons = [...host.querySelectorAll("button")];
      expect(
        buttons.find((button) =>
          button.textContent?.includes("审核通过并删除图片"),
        )!.disabled,
      ).toBe(true);
      expect(
        buttons.find((button) => button.textContent?.includes("查看校园卡"))!
          .disabled,
      ).toBe(true);
      expect(host.textContent).toContain("请填写原因并退回补充");
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
  it("与角色授权分离，通过审核后清除预览并显示真实清理状态", async () => {
    const pending = {
      id: "m1",
      username: "student",
      realName: "测试",
      requestedStudentId: "20260001",
      verificationStatus: "PENDING",
      verificationVersion: 1,
      disabled: false,
      createdAt: "2026-08-27T00:00:00Z",
      assets: [
        {
          id: "a1",
          version: 1,
          state: "READY",
          deleteAfter: new Date(Date.now() + 86400000).toISOString(),
        },
      ],
    };
    (memberRequest as any).mockImplementation(async (path: string) =>
      path.includes("/review")
        ? {
            ...pending,
            verificationStatus: "APPROVED",
            assets: [{ ...pending.assets[0], state: "DELETE_PENDING" }],
          }
        : path === "/m1"
          ? pending
          : { data: [pending], total: 1 },
    );
    (cardPreview as any).mockResolvedValue(new Blob(["test"]));
    URL.createObjectURL = jest.fn(() => "blob:card-test");
    URL.revokeObjectURL = jest.fn();
    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const click = async (text: string) => {
      const button = [...host.querySelectorAll("button")].find((el) =>
        el.textContent?.includes(text),
      );
      expect(button).toBeDefined();
      await act(async () => button!.click());
    };
    try {
      await act(async () => root.render(<MemberAccountsPage />));
      expect(host.textContent).toContain("网页用户审核");
      expect(host.textContent).not.toContain("角色权限");
      await click("开始审核");
      await click("查看校园卡");
      expect(host.querySelector("img")).not.toBeNull();
      await click("审核通过并删除图片");
      expect(host.querySelector("img")).toBeNull();
      expect(host.textContent).toContain("图片清理中");
      expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:card-test");
      expect(memberRequest).toHaveBeenCalledWith(
        "/m1/review",
        "PATCH",
        expect.objectContaining({ decision: "APPROVED", version: 1 }),
      );
    } finally {
      await act(async () => root.unmount());
      host.remove();
      confirm.mockRestore();
    }
  });

  it("账号维护：停用与重新启用账号，调用 PATCH /:id/status", async () => {
    const member = {
      id: "m1",
      username: "student_toggle",
      verificationStatus: "APPROVED",
      verificationVersion: 1,
      disabled: false,
      createdAt: "2026-08-27T00:00:00Z",
      assets: [],
    };
    (memberRequest as any).mockImplementation(async (path: string, method?: string, body?: any) => {
      if (path === "/m1/status" && method === "PATCH") {
        member.disabled = body.disabled;
        return member;
      }
      if (path === "/m1") return member;
      return { data: [member], total: 1 };
    });

    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      await act(async () => root.render(<MemberAccountsPage />));
      await act(async () => {
        [...host.querySelectorAll("button")].find((b) => b.textContent === "查看详情")!.click();
      });

      const disableBtn = [...host.querySelectorAll("button")].find((b) => b.textContent === "停用账号")!;
      expect(disableBtn).toBeDefined();

      await act(async () => disableBtn.click());
      expect(memberRequest).toHaveBeenCalledWith("/m1/status", "PATCH", { disabled: true });

      const enableBtn = [...host.querySelectorAll("button")].find((b) => b.textContent === "启用账号")!;
      expect(enableBtn).toBeDefined();

      await act(async () => enableBtn.click());
      expect(memberRequest).toHaveBeenCalledWith("/m1/status", "PATCH", { disabled: false });
    } finally {
      await act(async () => root.unmount());
      host.remove();
      confirm.mockRestore();
    }
  });

  it("账号维护：人工核验后重置密码，调用 PATCH /:id/reset-password", async () => {
    const member = {
      id: "m1",
      username: "student_reset",
      verificationStatus: "APPROVED",
      verificationVersion: 1,
      disabled: false,
      createdAt: "2026-08-27T00:00:00Z",
      assets: [],
    };
    (memberRequest as any).mockImplementation(async (path: string) => {
      if (path === "/m1") return member;
      if (path.includes("/reset-password")) return { id: "m1" };
      return { data: [member], total: 1 };
    });

    const confirm = jest.spyOn(window, "confirm").mockReturnValue(true);
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      await act(async () => root.render(<MemberAccountsPage />));
      await act(async () => {
        [...host.querySelectorAll("button")].find((b) => b.textContent === "查看详情")!.click();
      });

      const form = host.querySelector("details form") as HTMLFormElement;
      expect(form).not.toBeNull();
      const pwdInput = form.querySelector('input[type="password"]') as HTMLInputElement;

      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          pwdInput,
          "NewSecretPassword!2026",
        );
        pwdInput.dispatchEvent(new Event("input", { bubbles: true }));
      });

      await act(async () => {
        form.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      expect(memberRequest).toHaveBeenCalledWith("/m1/reset-password", "PATCH", {
        password: "NewSecretPassword!2026",
      });
    } finally {
      await act(async () => root.unmount());
      host.remove();
      confirm.mockRestore();
    }
  });

  it("搜索与分页交互：提交关键字并切换下一页", async () => {
    (memberRequest as any).mockResolvedValue({ data: [], total: 45 });
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);

    try {
      await act(async () => root.render(<MemberAccountsPage />));

      const searchInput = host.querySelector('input[aria-label="搜索用户名或学号"]') as HTMLInputElement;
      await act(async () => {
        Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")!.set!.call(
          searchInput,
          "2026001",
        );
        searchInput.dispatchEvent(new Event("input", { bubbles: true }));
      });

      const searchForm = host.querySelector("form.account-toolbar") as HTMLFormElement;
      await act(async () => {
        searchForm.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true }));
      });

      expect(memberRequest).toHaveBeenLastCalledWith("?page=1&limit=20&search=2026001&status=PENDING");

      // 点击下一页
      const nextBtn = [...host.querySelectorAll("button")].find((b) => b.textContent === "下一页")!;
      expect(nextBtn.disabled).toBe(false);

      await act(async () => nextBtn.click());
      expect(memberRequest).toHaveBeenLastCalledWith("?page=2&limit=20&search=2026001&status=PENDING");
    } finally {
      await act(async () => root.unmount());
      host.remove();
    }
  });
});
