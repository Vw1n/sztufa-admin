import React from 'react';
import { Calendar, Edit2, Globe, Trash2 } from 'lucide-react';
import { NewsDTO } from '../../../api/service';

interface NewsTableProps {
  newsList: NewsDTO[];
  onEdit: (news: NewsDTO) => void;
  onDelete: (id: string, title: string) => void;
}

export const NewsTable: React.FC<NewsTableProps> = ({
  newsList,
  onEdit,
  onDelete,
}) => {
  return (
    <>
      {/* 桌面端表格 */}
      <div className="player-table-wrapper desktop-news-view">
        <table className="player-table">
          <thead>
            <tr>
              <th style={{ width: '80px' }}>封面图</th>
              <th>标题与简介</th>
              <th style={{ width: '90px' }}>分类</th>
              <th style={{ width: '110px' }}>发布日期</th>
              <th style={{ width: '150px' }}>公众号链接</th>
              <th style={{ width: '100px', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {newsList.map((item) => (
              <tr key={item.id}>
                <td>
                  {item.coverImage ? (
                    <img src={item.coverImage} alt="封面" style={{ width: '56px', height: '38px', objectFit: 'cover', borderRadius: '4px', border: '1px solid #eee' }} />
                  ) : (
                    <div style={{ width: '56px', height: '38px', background: '#f1f3f5', borderRadius: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', color: '#adb5bd' }}>无封面</div>
                  )}
                </td>
                <td>
                  <div style={{ fontWeight: 600, color: '#212529', marginBottom: '4px' }}>{item.title}</div>
                  <div style={{ fontSize: '12px', color: '#868e96', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {item.description}
                  </div>
                </td>
                <td>
                  <span style={{ padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600, background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db', color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00' }}>
                    {item.category}
                  </span>
                </td>
                <td style={{ color: '#495057', fontSize: '13px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                    <Calendar size={12} color="#adb5bd" />
                    {item.date}
                  </span>
                </td>
                <td>
                  <a href={item.wechatUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', color: '#3b5bdb', textDecoration: 'none', fontSize: '13px' }}>
                    <Globe size={13} />打开文章
                  </a>
                </td>
                <td style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button onClick={() => onEdit(item)} className="action-btn edit-btn" title="编辑">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => onDelete(item.id!, item.title)} className="delete-btn small" title="删除">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 移动端卡片列表 */}
      <div className="mobile-news-view">
        {newsList.map((item) => (
          <div key={item.id} className="mobile-news-card">
            <div className="mobile-news-card-header">
              {item.coverImage ? (
                <img src={item.coverImage} alt="封面" className="mobile-news-cover" />
              ) : (
                <div className="mobile-news-cover-placeholder">无封面</div>
              )}
              <div className="mobile-news-card-title-area">
                <div className="mobile-news-title">{item.title}</div>
                <div className="mobile-news-meta">
                  <span className="mobile-news-category" style={{ background: item.category === '招新' ? '#ebfbee' : item.category === '赛事' ? '#edf2ff' : '#fff9db', color: item.category === '招新' ? '#2b8a3e' : item.category === '赛事' ? '#3b5bdb' : '#f08c00' }}>
                    {item.category}
                  </span>
                  <span className="mobile-news-date">📅 {item.date}</span>
                </div>
              </div>
            </div>
            {item.description && (
              <div className="mobile-news-desc">{item.description}</div>
            )}
            <div className="mobile-news-card-actions">
              <a href={item.wechatUrl} target="_blank" rel="noopener noreferrer" className="mobile-news-link">
                <Globe size={14} />查看微信推文
              </a>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => onEdit(item)} className="action-btn edit-btn" title="编辑">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => onDelete(item.id!, item.title)} className="delete-btn small" title="删除">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};
