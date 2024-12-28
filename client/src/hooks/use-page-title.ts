import { useEffect } from 'react';

export function usePageTitle(title: string) {
  useEffect(() => {
    const baseTitle = 'Fintellect';
    document.title = title ? `${title} | ${baseTitle}` : baseTitle;
  }, [title]);
} 