import React, { createContext, useContext, type PropsWithChildren } from 'react';
import { type Logger } from 'pino';
import { useMidnight, type UseMidnightResult } from '../hooks/useMidnight';

const MidnightContext = createContext<UseMidnightResult | undefined>(undefined);

export type MidnightProviderProps = PropsWithChildren<{
  logger: Logger;
}>;

export const MidnightProvider: React.FC<MidnightProviderProps> = ({ logger, children }) => {
  const midnight = useMidnight(logger);
  return <MidnightContext.Provider value={midnight}>{children}</MidnightContext.Provider>;
};

export const useMidnightContext = (): UseMidnightResult => {
  const context = useContext(MidnightContext);
  if (!context) {
    throw new Error('A <MidnightProvider /> is required.');
  }
  return context;
};
