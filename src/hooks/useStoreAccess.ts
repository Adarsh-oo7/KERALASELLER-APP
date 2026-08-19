import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { fetchStaffMe } from '../api/seller';

export function useStoreAccess() {
  const [allowed, setAllowed] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      fetchStaffMe()
        .then((data) => {
          if (live) setAllowed(data.allowed_permissions || []);
        })
        .catch(() => {
          if (live) setAllowed([]);
        });
      return () => {
        live = false;
      };
    }, []),
  );

  return {
    can: (code: string) => allowed.includes(code),
    allowed,
  };
}
