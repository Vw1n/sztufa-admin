import { useCallback, useEffect, useState } from 'react';
import { registrationApi } from '../../api/registration.service';
import { seasonApi } from '../../api/service';
import { SeasonDTO } from '../../api/types';
import {
  RegistrationListItemDTO,
  RegistrationStatusType,
  TeamRegistrationDTO,
} from '../registration/registration.types';
import { ApiError } from '../../api/http';

export function useRegistrationReview() {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [seasons, setSeasons] = useState<SeasonDTO[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<RegistrationStatusType | ''>('');
  const [page, setPage] = useState<number>(1);
  const [pageSize] = useState<number>(20);

  const [listData, setListData] = useState<{
    items: RegistrationListItemDTO[];
    total: number;
    totalPages: number;
  }>({ items: [], total: 0, totalPages: 1 });

  // Detail Modal / Sheet
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<TeamRegistrationDTO | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [reviewComment, setReviewComment] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load Seasons
  useEffect(() => {
    const fetchSeasons = async () => {
      try {
        const data = await seasonApi.getAll();
        setSeasons(data);
      } catch (err) {
        console.error('获取赛季列表失败:', err);
      }
    };
    fetchSeasons();
  }, []);

  // Fetch Admin Summary List
  const loadList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await registrationApi.getAdminList({
        seasonId: selectedSeasonId || undefined,
        status: statusFilter || undefined,
        page,
        pageSize,
      });
      setListData({
        items: res.items,
        total: res.total,
        totalPages: res.totalPages,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : '获取报名列表失败';
      setError(msg);
    } finally {
      setLoading(false);
    }
  }, [selectedSeasonId, statusFilter, page, pageSize]);

  useEffect(() => {
    loadList();
  }, [loadList]);

  // Load Detail
  const openDetail = async (id: string) => {
    setSelectedId(id);
    setDetailLoading(true);
    setReviewComment('');
    try {
      const data = await registrationApi.getDetail(id);
      setDetail(data);
      if (data.reviewComment) {
        setReviewComment(data.reviewComment);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : '获取报名详情失败');
      setSelectedId(null);
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedId(null);
    setDetail(null);
    setReviewComment('');
  };

  // Approve
  const handleApprove = async () => {
    if (!selectedId || !detail) return;
    if (detail.status !== 'SUBMITTED') {
      alert('只有处在『已提交』状态的报名才能审核通过');
      return;
    }
    if (!window.confirm(`确认要审核通过球队「${detail.teamData?.teamName || ''}」的赛季报名吗？通过后将原子化写入正式赛季球队与球员名单。`)) {
      return;
    }

    setActionLoading(true);
    try {
      const updated = await registrationApi.approve(selectedId, reviewComment);
      setDetail(updated);
      alert('审核通过！已完成正式赛季球队及球员数据物化。');
      loadList();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert('操作失败 (409)：该报名可能已被其他管理员处理或状态非待审核，请刷新列表');
      } else {
        alert(err instanceof Error ? err.message : '审核操作失败');
      }
    } finally {
      setActionLoading(false);
    }
  };

  // Request Changes
  const handleRequestChanges = async () => {
    if (!selectedId || !detail) return;
    if (detail.status !== 'SUBMITTED') {
      alert('只有处在『已提交』状态的报名才能退回修改');
      return;
    }
    if (!reviewComment.trim()) {
      alert('退回修改时必须填写审核意见，以便领队了解修改要求');
      return;
    }

    setActionLoading(true);
    try {
      const updated = await registrationApi.requestChanges(selectedId, reviewComment);
      setDetail(updated);
      alert('已将报名申请退回给领队修改。');
      loadList();
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        alert('操作失败 (409)：该报名可能已被处理或状态非待审核');
      } else {
        alert(err instanceof Error ? err.message : '退回操作失败');
      }
    } finally {
      setActionLoading(false);
    }
  };

  return {
    loading,
    error,
    seasons,
    selectedSeasonId,
    setSelectedSeasonId,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    listData,
    selectedId,
    detail,
    detailLoading,
    reviewComment,
    setReviewComment,
    actionLoading,
    openDetail,
    closeDetail,
    handleApprove,
    handleRequestChanges,
    refresh: loadList,
  };
}
