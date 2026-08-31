import React, { useCallback, useEffect, useState } from "react";
import { authApi, userApi } from "../../api/auth.service";
import { AuthUser, TeamDTO } from "../../api/types";
import { useSystemTeams } from "../system/hooks";
import "./accounts.css";
const roles: Record<string, string> = {
  match_scorer: "赛事记录员",
  news_editor: "新闻编辑",
  coach: "教练 / 领队",
  super_admin: "超级管理员",
};
function TeamSelect({
  value,
  teams,
  onChange,
}: {
  value: string;
  teams: TeamDTO[];
  onChange: (id: string) => void;
}) {
  return (
    <select
      aria-label="绑定球队"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">暂不绑定</option>
      {teams.map((team) => (
        <option key={team.id} value={team.id}>
          {team.teamName}
        </option>
      ))}
    </select>
  );
}
export default function StaffAccountsPage() {
  const { teams } = useSystemTeams();
  const [users, setUsers] = useState<AuthUser[]>([]),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [username, setUsername] = useState(""),
    [password, setPassword] = useState(""),
    [role, setRole] = useState("match_scorer"),
    [teamId, setTeamId] = useState("");
  const [selected, setSelected] = useState<AuthUser | null>(null),
    [reset, setReset] = useState("");
  const load = useCallback(async () => {
    try {
      setUsers(await userApi.getAll());
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    }
  }, []);
  useEffect(() => {
    void load();
  }, [load]);
  async function act(action: () => Promise<unknown>) {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "操作失败");
    } finally {
      setBusy(false);
    }
  }
  return (
    <section className="accounts-page">
      <h1>后台账号管理</h1>
      <p>仅管理工作人员。网页注册用户请到“网页用户”页面查看。</p>
      {error && (
        <p role="alert" className="account-error">
          {error}
        </p>
      )}
      <form
        className="account-form"
        onSubmit={(e) => {
          e.preventDefault();
          void act(async () => {
            await authApi.createUser({
              username,
              password,
              role,
              ...(role === "coach" && teamId ? { teamId } : {}),
            });
            setUsername("");
            setPassword("");
          });
        }}
      >
        <label>
          用户名
          <input
            required
            minLength={3}
            maxLength={30}
            pattern="[a-zA-Z0-9_-]{3,30}"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          初始密码
          <input
            type="password"
            required
            autoComplete="new-password"
            minLength={6}
            maxLength={128}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          角色
          <select value={role} onChange={(e) => setRole(e.target.value)}>
            {Object.entries(roles).map(([key, label]) => (
              <option value={key} key={key}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {role === "coach" && (
          <label>
            球队
            <TeamSelect teams={teams} value={teamId} onChange={setTeamId} />
          </label>
        )}
        <button disabled={busy}>创建后台账号</button>
      </form>
      <button disabled={busy} onClick={() => void load()}>
        刷新列表
      </button>
      <div className="account-table-wrap">
        <table>
          <thead>
            <tr>
              <th>用户名</th>
              <th>角色</th>
              <th>球队</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>{user.username}</td>
                <td>{roles[user.role]}</td>
                <td>
                  {teams.find((t) => t.id === user.teamId)?.teamName || "—"}
                </td>
                <td>
                  <button
                    disabled={busy}
                    onClick={() => {
                      setSelected({ ...user });
                      setReset("");
                    }}
                  >
                    管理
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {selected && (
        <section className="account-detail">
          <h2>管理 {selected.username}</h2>
          <label>
            角色
            <select
              value={selected.role}
              onChange={(e) =>
                setSelected({
                  ...selected,
                  role: e.target.value,
                  teamId:
                    e.target.value === "coach" ? selected.teamId : undefined,
                })
              }
            >
              {Object.entries(roles).map(([key, label]) => (
                <option value={key} key={key}>
                  {label}
                </option>
              ))}
            </select>
          </label>
          {selected.role === "coach" && (
            <TeamSelect
              teams={teams}
              value={selected.teamId || ""}
              onChange={(id) => setSelected({ ...selected, teamId: id })}
            />
          )}
          <div className="account-toolbar">
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm("确认调整权限？该账号旧会话将失效。"))
                  void act(() =>
                    userApi.updateRole(
                      selected.id,
                      selected.role,
                      selected.teamId || null,
                    ),
                  );
              }}
            >
              保存权限
            </button>
            <button disabled={busy} onClick={() => setSelected(null)}>
              关闭
            </button>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (window.confirm("确认重置密码并撤销旧会话？"))
                void act(async () => {
                  await userApi.resetPassword(selected.id, reset);
                  setReset("");
                });
            }}
          >
            <label>
              新密码
              <input
                type="password"
                required
                autoComplete="new-password"
                minLength={6}
                maxLength={128}
                value={reset}
                onChange={(e) => setReset(e.target.value)}
              />
            </label>
            <button disabled={busy}>重置密码</button>
          </form>
          <button
            disabled={busy}
            onClick={() => {
              if (
                window.confirm(
                  "确认删除该账号？此操作可能影响关联记录，请先核实。",
                )
              )
                void act(async () => {
                  await userApi.delete(selected.id);
                  setSelected(null);
                });
            }}
          >
            删除账号
          </button>
        </section>
      )}
    </section>
  );
}
