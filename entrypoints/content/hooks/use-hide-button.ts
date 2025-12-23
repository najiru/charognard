import { useContext } from 'react';
import { HideButtonContext } from '../contexts/hide-button';

export const useHideButton = () => useContext(HideButtonContext);
