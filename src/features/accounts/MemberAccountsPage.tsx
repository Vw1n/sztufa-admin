import React, { useCallback, useEffect, useRef, useState } from "react";
import { cardPreview, Member, memberRequest } from "../../api/members";
import "./accounts.css";
const labels: Record<string, string> = {
  PENDING: "待审核",
  APPROVED: "已通过",
  CHANGES_REQUESTED: "需补充材料",
  LEGACY: "历史账号待补验",
};
export default function MemberAccountsPage() {
  const [rows, setRows] = useState<Member[]>([]),
    [total, setTotal] = useState(0);
  const [page, setPage] = useState(1),
    [status, setStatus] = useState("PENDING"),
    [search, setSearch] = useState("");
  const [filter, setFilter] = useState(""),
    [error, setError] = useState(""),
    [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Member | null>(null),
    [preview, setPreview] = useState("");
  const [reason, setReason] = useState(""),
    [busy, setBusy] = useState(false),
    [password, setPassword] = useState("");
  const requestVersion = useRef(0),
    detailVersion = useRef(0);
  const detailPanel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (detail?.id) {
      detailPanel.current?.focus();
      detailPanel.current?.scrollIntoView?.({ block: "start", behavior: "smooth" });
    }
  }, [detail?.id]);
  const validAsset = detail?.assets?.find(
    (asset) =>
      asset.state === "READY" &&
      asset.version === detail.verificationVersion &&
      new Date(asset.deleteAfter).getTime() > Date.now(),
  );
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );
  const load = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    try {
      const result = await memberRequest<{ data: Member[]; total: number }>(
        `?page=${page}&limit=20&search=${encodeURIComponent(filter)}${status ? `&status=${status}` : ""}`,
      );
      if (version === requestVersion.current) {
        setRows(result.data);
        setTotal(result.total);
      }
    } catch (e) {
      if (version === requestVersion.current)
        setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [page, status, filter]);
  useEffect(() => {
    void load();
    const version = requestVersion.current;
    return () => {
      requestVersion.current = version + 1;
    };
  }, [load]);
  async function open(id: string) {
    const version = ++detailVersion.current;
    setPreview("");
    setReason("");
    setPassword("");
    setDetail(null);
    try {
      const result = await memberRequest<Member>(`/${id}`);
      if (version === detailVersion.current) setDetail(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "读取失败");
    }
  }
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setPreview("");
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="accounts-page">
      <h1>网页用户审核</h1>
      <p>审核网页注册用户的校园身份。通过后开放已认证用户功能，不授予后台权限。</p>
      <div className="review-guide">
        <strong>校园卡人工审核</strong>
        <ol>
          <li>选择待审核用户，点击“开始审核”</li>
          <li>查看校园卡，核对学校、姓名和学号</li>
          <li>通过并自动删除图片，或填写原因退回补充</li>
        </ol>
      </div>
      <nav className="account-toolbar review-filters" aria-label="审核队列">
        {[["PENDING", "待审核"], ["CHANGES_REQUESTED", "需补充材料"], ["APPROVED", "已通过"], ["LEGACY", "历史账号待补验"], ["", "全部用户"]].map(([key, label]) => (
          <button key={key} type="button" aria-pressed={status === key} disabled={busy} onClick={() => { setStatus(key); setPage(1); }}>
            {label}
          </button>
        ))}
      </nav>
      <form
        className="account-toolbar"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setFilter(search);
        }}
      >
        <input
          aria-label="搜索用户名或学号"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="用户名或学号"
          maxLength={50}
        />
        <button type="submit">搜索</button>
        <button type="button" onClick={() => void load()}>
          刷新
        </button>
      </form>
      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
      {detail && (
        <section ref={detailPanel} tabIndex={-1} className="account-detail" aria-label="用户审核详情">
          <div className="account-toolbar">
            <h2>{detail.verificationStatus === "PENDING" ? "校园卡审核" : "审核记录"} · {detail.username}</h2>
            <button
              disabled={busy}
              onClick={() => {
                detailVersion.current++;
                setDetail(null);
                setPreview("");
              }}
            >
              关闭详情
            </button>
            <button disabled={busy} onClick={() => void open(detail.id)}>
              刷新清理状态
            </button>
          </div>
          <p>
            申请姓名：{detail.realName || "未填写"} / 学号：
            {detail.requestedStudentId || "未填写"}
          </p>
          <p>
            状态：{labels[detail.verificationStatus]} / {detail.reviewComment}
          </p>
          <p>
            图片状态：
            {!detail.assets?.length
              ? "未上传"
              : detail.assets.every((a) => a.state === "DELETED")
                ? "图片已删除"
                : detail.verificationStatus === "APPROVED"
                  ? "图片清理中（失败自动重试）"
                  : "材料待处理"}
          </p>
          {detail.verificationStatus === "PENDING" && (
            <>
              <h3>1. 核验校园卡材料</h3>
              <p>请核对校园卡上的学校、姓名和学号是否与申请信息一致；不要仅凭照片处理密码重置。</p>
              {detail.disabled && <p role="status">账号已停用，启用后才能进行审核。</p>}
              {!validAsset && (
                <p role="status">
                  没有当前有效的校园卡材料，不能通过审核；请填写原因并退回补充。
                </p>
              )}
              <button
                disabled={busy || !validAsset || detail.disabled}
                onClick={() =>
                  void act(async () => {
                    const asset = validAsset;
                    if (!asset)
                      throw new Error("当前没有有效材料，请退回补充或刷新");
                    const version = detailVersion.current,
                      blob = await cardPreview(detail.id, asset.id);
                    if (version === detailVersion.current)
                      setPreview(URL.createObjectURL(blob));
                  })
                }
              >
                查看校园卡（记录访问日志）
              </button>
              {preview && (
                <img
                  className="card-preview"
                  src={preview}
                  alt="本次申请的校园卡材料"
                />
              )}
              <h3>2. 提交审核结果</h3>
              <p>通过后自动删除校园卡图片；删除失败会自动重试，清理状态会显示在此处。</p>
              <label>
                审核说明
                <textarea
                  value={reason}
                  maxLength={300}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="退回时必须填写原因"
                />
              </label>
              <div className="account-toolbar">
                <button
                  className="review-primary"
                  disabled={busy || detail.disabled || !validAsset}
                  onClick={() => {
                    if (
                      !window.confirm(
                        "确认学校、姓名及学号一致？通过后校园卡图片将自动删除，不能再次查看。",
                      )
                    )
                      return;
                    setPreview("");
                    void act(async () =>
                      setDetail(
                        await memberRequest<Member>(
                          `/${detail.id}/review`,
                          "PATCH",
                          {
                            decision: "APPROVED",
                            version: detail.verificationVersion,
                            reason,
                          },
                        ),
                      ),
                    );
                  }}
                >
                  审核通过并删除图片
                </button>
                <button
                  className="review-return"
                  disabled={busy || detail.disabled || !reason.trim()}
                  onClick={() =>
                    void act(async () =>
                      setDetail(
                        await memberRequest<Member>(
                          `/${detail.id}/review`,
                          "PATCH",
                          {
                            decision: "CHANGES_REQUESTED",
                            version: detail.verificationVersion,
                            reason,
                          },
                        ),
                      ),
                    )
                  }
                >
                  退回补充
                </button>
              </div>
            </>
          )}
          <details className="review-account-settings">
          <summary>账号维护（启用 / 停用、重置密码）</summary>
          <button
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  `确认${detail.disabled ? "启用" : "停用"}该账号？`,
                )
              )
                void act(async () => {
                  await memberRequest(`/${detail.id}/status`, "PATCH", {
                    disabled: !detail.disabled,
                  });
                  await open(detail.id);
                });
            }}
          >
            {detail.disabled ? "启用账号" : "停用账号"}
          </button>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (
                window.confirm(
                  "请确认已通过独立渠道核实身份；校园卡照片不能单独作为重置依据。重置后旧会话失效。",
                )
              )
                void act(async () => {
                  await memberRequest(`/${detail.id}/reset-password`, "PATCH", {
                    password,
                  });
                  setPassword("");
                });
            }}
          >
            <label>
              人工核验后重置密码
              <input
                type="password"
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </label>
            <button disabled={busy}>重置密码</button>
          </form>
          </details>
        </section>
      )}
      {loading ? (
        <p role="status">加载中…</p>
      ) : (
        <>
          <h2>{status ? labels[status] : "全部用户"} · {total} 人</h2>
          <div className="account-table-wrap">
            <table>
              <thead>
                <tr>
                  <th>用户</th>
                  <th>学号</th>
                  <th>审核状态</th>
                  <th>账号状态</th>
                  <th>注册时间</th>
                  <th>操作</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      {row.username}
                      <small>{row.nickname}</small>
                    </td>
                    <td>
                      {row.requestedStudentId || row.studentId || "未填写"}
                    </td>
                    <td><span className={`review-status review-status-${row.verificationStatus.toLowerCase()}`}>{labels[row.verificationStatus]}</span></td>
                    <td>{row.disabled ? "已停用" : "正常"}</td>
                    <td>{new Date(row.createdAt).toLocaleDateString()}</td>
                    <td>
                      <button className={row.verificationStatus === "PENDING" ? "review-primary" : undefined} disabled={busy} onClick={() => void open(row.id)}>
                        {row.verificationStatus === "PENDING" ? "开始审核" : "查看详情"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!rows.length && <p className="review-empty">{status === "PENDING" ? "暂无待审核申请。用户上传校园卡并提交注册或补充材料后，会出现在这里。" : "暂无符合条件的用户"}</p>}
          <div className="account-toolbar">
            <button disabled={page <= 1} onClick={() => setPage(page - 1)}>
              上一页
            </button>
            <span>
              第 {page} 页 · 共 {total} 人
            </span>
            <button
              disabled={page * 20 >= total}
              onClick={() => setPage(page + 1)}
            >
              下一页
            </button>
          </div>
        </>
      )}
    </section>
  );
}
