import React from 'react';
import { BRAND, getPageTitle } from '../config/brand';

/** Sets document.title when mounted; restores default on unmount */
export const usePageTitle = (section) => {
  React.useEffect(() => {
    const previous = document.title;
    document.title = getPageTitle(section);
    return () => {
      document.title = previous;
    };
  }, [section]);
};

export const setDefaultPageTitle = () => {
  document.title = getPageTitle();
};

export { BRAND };
