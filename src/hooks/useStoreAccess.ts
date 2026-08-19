import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';

import { fetchStaffMe } from '../api/seller';
import { canUseTool, ownerToolsWhenStaffMeMissing } from '../lib/storeAccess';

export function useStoreAccess() {
  const [allowed, setAllowed] = useState<string[] | null>(null);
  const [isOwner, setIsOwner] = useState(true);
  const [features, setFeatures] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      let live = true;
      fetchStaffMe()
        .then((data) => {
          if (!live) return;
          const owner = data.is_owner !== false;
          setIsOwner(owner);
          setAllowed(ownerToolsWhenStaffMeMissing(owner, data.allowed_permissions));
          setFeatures(data.entitlements?.features || []);
        })
        .catch(() => {
          if (!live) return;
          setIsOwner(true);
          setAllowed(null);
          setFeatures([]);
        });
      return () => {
        live = false;
      };
    }, []),
  );

  return {
    can: (code: string | string[]) => canUseTool(allowed, code, isOwner),
    allowed,
    isOwner,
    features,
    hasFeature: (code: string) => features.includes(code),
  };
}
