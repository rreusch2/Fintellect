interface Window {
  Plaid: {
    create: (config: any) => Promise<{
      open: () => void;
      exit: () => void;
    }>;
  };
} 