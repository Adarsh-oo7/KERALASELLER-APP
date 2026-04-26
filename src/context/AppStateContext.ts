// // src/contexts/AppStateContext.ts  ← NEW FILE
// import { createContext } from 'react';

// export interface AppStateContextType {
//   isDrawerOpen:         boolean;
//   setIsDrawerOpen:      (open: boolean) => void;
//   notificationCount:    number;
//   setNotificationCount: (count: number) => void;
//   currentTitle:         string;
//   setCurrentTitle:      (title: string) => void;
//   currentSubtitle?:     string;
//   setCurrentSubtitle:   (subtitle?: string) => void;
//   refreshNotifications: () => void;
// }

// export const AppStateContext = createContext<AppStateContextType>({
//   isDrawerOpen:         false,
//   setIsDrawerOpen:      () => {},
//   notificationCount:    0,
//   setNotificationCount: () => {},
//   currentTitle:         'Kerala Sellers',
//   setCurrentTitle:      () => {},
//   currentSubtitle:      '',
//   setCurrentSubtitle:   () => {},
//   refreshNotifications: () => {},
// });
// src/context/AppStateContext.ts
import React from 'react';

interface AppStateContextType {
  isDrawerOpen:           boolean;
  setIsDrawerOpen:        React.Dispatch<React.SetStateAction<boolean>>;
  notificationCount:      number;
  setNotificationCount:   React.Dispatch<React.SetStateAction<number>>;
  currentTitle:           string;
  setCurrentTitle:        React.Dispatch<React.SetStateAction<string>>;
  currentSubtitle:        string | undefined;
  setCurrentSubtitle:     React.Dispatch<React.SetStateAction<string | undefined>>;
  refreshNotifications:   () => Promise<void>;
}

export const AppStateContext = React.createContext<AppStateContextType>({
  isDrawerOpen:         false,
  setIsDrawerOpen:      () => {},
  notificationCount:    0,
  setNotificationCount: () => {},
  currentTitle:         'Dashboard',
  setCurrentTitle:      () => {},
  currentSubtitle:      undefined,
  setCurrentSubtitle:   () => {},
  refreshNotifications: async () => {},
});