import { useEffect, useState } from 'react';
import api from '../services/api';

export default function NotificationsBadge() {
  const [count, setCount] = useState(0);

  const fetchCount = () => {
    api.get('/notifications/unread/count').then((res) => setCount(res.data.count ?? res.data)).catch(() => {});
  };

  useEffect(() => {
    fetchCount();
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  if (count === 0) return null;

  return (
    <span className="ml-auto bg-red-500 text-white text-xs rounded-full h-5 min-w-[20px] px-1 flex items-center justify-center">
      {count > 99 ? '99+' : count}
    </span>
  );
}
