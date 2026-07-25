export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '暂无时间';
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return '无效时间';
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`;
  } catch {
    return '时间格式错误';
  }
};

export const getActionTagClass = (action: string): string => {
  if (action.includes('DELETE')) return 'tag-danger';
  if (action.includes('CREATE')) return 'tag-success';
  if (action.includes('UPDATE')) return 'tag-warning';
  return 'tag-info';
};

export const getActionLabel = (action: string): string => {
  switch (action) {
    case 'CREATE_MATCH': return '录入比赛';
    case 'UPDATE_MATCH': return '更新比赛';
    case 'DELETE_MATCH': return '删除比赛';
    case 'CREATE_PLAYER': return '新增球员';
    case 'UPDATE_PLAYER': return '更新球员';
    case 'DELETE_PLAYER': return '删除球员';
    case 'CREATE_TEAM': return '创建球队';
    case 'UPDATE_TEAM': return '更新球队';
    case 'DELETE_TEAM': return '删除球队';
    case 'USER_REGISTER': return '用户注册';
    case 'UPDATE_USER_ROLE': return '权限管理';
    case 'DELETE_USER': return '删除账号';
    case 'RESET_USER_PASSWORD': return '重置密码';
    case 'CREATE_BACKUP': return '创建备份';
    case 'RESTORE_BACKUP': return '还原数据库';
    case 'ARCHIVE_SEASON': return '归档赛季';
    case 'USER_LOGIN': return '用户登录';
    default: return action;
  }
};

export interface ParsedLogDetails {
  summary: string;
  diff: string;
  diffItems: string[];
}

export const parseLogDetails = (details: string): ParsedLogDetails => {
  if (!details) {
    return { summary: '', diff: '', diffItems: [] };
  }

  const splitIndex = details.indexOf(' 的信息: ');
  const splitIndex2 = details.indexOf(' 的权限设置: ');
  const splitIndex3 = details.indexOf(' 比分/信息: ');

  let summary = details;
  let diff = '';

  if (splitIndex !== -1) {
    summary = details.substring(0, splitIndex + 5);
    diff = details.substring(splitIndex + 6);
  } else if (splitIndex2 !== -1) {
    summary = details.substring(0, splitIndex2 + 7);
    diff = details.substring(splitIndex2 + 8);
  } else if (splitIndex3 !== -1) {
    summary = details.substring(0, splitIndex3 + 8);
    diff = details.substring(splitIndex3 + 8);
  }

  const diffItems = diff ? diff.split(', ').filter(Boolean) : [];

  return { summary, diff, diffItems };
};

export const extractSubLogAttrs = (subLogs: { details?: string }[]): string[] => {
  const allAttrs: string[] = [];
  if (!subLogs) return allAttrs;

  subLogs.forEach(sub => {
    const subDetails = sub.details || '';
    const subSplit = subDetails.indexOf(' 的信息: ');
    const subSplit2 = subDetails.indexOf(' 的权限设置: ');
    const subSplit3 = subDetails.indexOf(' 比分/信息: ');

    let diffText = '';
    if (subSplit !== -1) diffText = subDetails.substring(subSplit + 6);
    else if (subSplit2 !== -1) diffText = subDetails.substring(subSplit2 + 8);
    else if (subSplit3 !== -1) diffText = subDetails.substring(subSplit3 + 8);

    if (diffText) {
      diffText.split(', ').forEach(pair => {
        const attrName = pair.split(':')[0].trim();
        if (attrName && !allAttrs.includes(attrName)) {
          allAttrs.push(attrName);
        }
      });
    }
  });

  return allAttrs;
};

export const parseSubLogItem = (subDetails: string): { mainText: string; diffText: string } => {
  const details = subDetails || '';
  const subSplit = details.indexOf(' 的信息: ');
  const subSplit2 = details.indexOf(' 的权限设置: ');
  const subSplit3 = details.indexOf(' 比分/信息: ');

  let mainText = details;
  let diffText = '';

  if (subSplit !== -1) {
    mainText = details.substring(0, subSplit + 5);
    diffText = details.substring(subSplit + 6);
  } else if (subSplit2 !== -1) {
    mainText = details.substring(0, subSplit2 + 7);
    diffText = details.substring(subSplit2 + 8);
  } else if (subSplit3 !== -1) {
    mainText = details.substring(0, subSplit3 + 8);
    diffText = details.substring(subSplit3 + 8);
  }

  return { mainText, diffText };
};
