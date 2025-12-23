import { createContext } from 'react';

export interface HideButtonContextType {
  isHidden: boolean;
  hideButton: () => void;
}

export const HideButtonContext = createContext<HideButtonContextType>({
  isHidden: false,
  hideButton: () => {},
});
