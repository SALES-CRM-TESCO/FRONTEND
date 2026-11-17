import { useEffect, useState, useCallback } from 'react';
import { api } from './api.js';
import { useNotifications } from './notifications.jsx';

export function useLiveApi(path) {
  const n = useNotifications();
  return useApi(path, [n?.tick]);
}

export function useApi(path, deps = []) {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const reload = useCallback(() => {
    if (!path) return;
    setLoading(true);
    api(path).then((d) => { setData(d); setError(''); }).catch((e) => setError(e.message)).finally(() => setLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, ...deps]);
  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}
