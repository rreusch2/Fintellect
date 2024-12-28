const handleActivateDemo = async () => {
    try {
      // Set demo mode first
      setDemoMode(true);
      
      const response = await fetch("/api/plaid/demo", {
        method: "POST",
        credentials: "include",
      });
  
      if (!response.ok) {
        // If the API call fails, revert demo mode
        setDemoMode(false);
        throw new Error("Failed to activate demo mode");
      }
  
      // Force a page reload to ensure all demo data is loaded
      window.location.reload();
    } catch (error) {
      console.error("Error activating demo mode:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to activate demo mode. Please try again.",
      });
    }
  }; 