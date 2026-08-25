'use client';

import { useApi } from '@/hooks/useApi';
import api from '@/services/api';
import Sidebar from './Sidebar';

/**
 * Chrome shared by every page. Capacity is fetched once here rather than in
 * each page, so the sidebar meter is consistent across routes.
 */
export default function AppShell({ children }) {
  const { data } = useApi(() => api.settings.get(), []);
  const capacity = data?.data?.capacity
    ? {
        ...data.data.capacity,
        percentUsed: data.data.capacity.maximumLoads
          ? (data.data.capacity.used / data.data.capacity.maximumLoads) * 100
          : 0,
      }
    : null;

  return (
    <div className="shell">
      <Sidebar capacity={capacity} />
      <div className="content">{children}</div>
    </div>
  );
}
