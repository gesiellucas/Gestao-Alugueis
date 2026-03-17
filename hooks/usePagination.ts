import { useState, useMemo, useEffect } from 'react';

export interface PaginationState<T> {
  page: number;
  setPage: (page: number) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
  totalPages: number;
  total: number;
  paginatedItems: T[];
  hasNextPage: boolean;
  hasPrevPage: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToFirst: () => void;
  goToLast: () => void;
}

export function usePagination<T>(items: T[], initialPageSize: number = 10): PaginationState<T> {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(initialPageSize);

  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  // Reset to page 1 when items change (e.g., filters applied)
  useEffect(() => {
    setPage(1);
  }, [total]);

  // Clamp page if it exceeds totalPages
  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const paginatedItems = useMemo(() => {
    const start = (page - 1) * pageSize;
    return items.slice(start, start + pageSize);
  }, [items, page, pageSize]);

  return {
    page,
    setPage,
    pageSize,
    setPageSize,
    totalPages,
    total,
    paginatedItems,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
    nextPage: () => setPage((p) => Math.min(p + 1, totalPages)),
    prevPage: () => setPage((p) => Math.max(p - 1, 1)),
    goToFirst: () => setPage(1),
    goToLast: () => setPage(totalPages),
  };
}
