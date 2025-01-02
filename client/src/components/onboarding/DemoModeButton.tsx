const handleActivateDemo = async () => {
    try {
      // Clear any existing demo state first
      localStorage.removeItem('demoMode');
      
      // Set demo mode
      setDemoMode(true);
      
      const response = await fetch("/api/plaid/demo", {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) {
        // If the API call fails, ensure demo mode is cleared
        setDemoMode(false);
        localStorage.removeItem('demoMode');
        throw new Error("Failed to activate demo mode");
      }
  
      // Force a clean reload without any URL parameters
      const url = new URL(window.location.href);
      url.searchParams.delete('demo');
      window.location.href = url.toString();
    } catch (error) {
      console.error("Error activating demo mode:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate demo mode. Please try again.",
      });
    }
}; 