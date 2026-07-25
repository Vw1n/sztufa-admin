import React from 'react';

interface NewsFiltersProps {
  categoryFilter: string;
  onSelectCategory: (category: string) => void;
}

export const NewsFilters: React.FC<NewsFiltersProps> = ({
  categoryFilter,
  onSelectCategory,
}) => {
  return (
    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap', padding: '12px 16px', background: '#f8f9fa', borderRadius: '8px', marginBottom: '20px' }}>
      <span style={{ fontSize: '13px', fontWeight: 600, color: '#495057' }}>📌 按分类筛选:</span>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {['all', '赛事', '招新', '活动', '资讯', '其他'].map((cat) => (
          <button
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              padding: '5px 14px',
              borderRadius: '20px',
              border: '1px solid',
              borderColor: categoryFilter === cat ? '#3b5bdb' : '#dee2e6',
              background: categoryFilter === cat ? '#3b5bdb' : '#fff',
              color: categoryFilter === cat ? '#fff' : '#495057',
              cursor: 'pointer',
              fontSize: '13px',
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>
    </div>
  );
};
