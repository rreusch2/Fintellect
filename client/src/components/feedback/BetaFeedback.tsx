import { useState } from "react";
import { MessageSquarePlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useUser } from "@/hooks/use-user";

export function BetaFeedback() {
  const [isOpen, setIsOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [location] = useLocation();
  const { user } = useUser();

  // Replace with your new Google Apps Script URL
  const FEEDBACK_URL = "https://script.google.com/macros/s/AKfycbzqjMFx_uR24-lFIV_ZSFdUIPFcT4PkmBP6jEP9EQoK2BellLuBN2njgKMTltgtSxIv/exec";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!feedback.trim()) return;
    
    setLoading(true);
    try {
      await fetch(FEEDBACK_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          feedback,
          page: location,
          userId: user?.id
        })
      });

      toast({
        title: "Feedback Submitted",
        description: "Thank you for helping us improve Fintellect!",
        variant: "default",
      });

      setFeedback("");
      setIsOpen(false);
    } catch (error) {
      console.error("Feedback submission error:", error);
      toast({
        title: "Error",
        description: "Failed to submit feedback. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <form 
          onSubmit={handleSubmit}
          className="bg-card border rounded-lg p-4 shadow-lg w-80 space-y-4"
        >
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Share Your Feedback
            </label>
            <Textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Tell us what you think..."
              className="h-24"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Sending..." : "Submit"}
            </Button>
          </div>
        </form>
      ) : (
        <Button
          onClick={() => setIsOpen(true)}
          className="group flex items-center gap-2 pr-3 pl-4 py-2 h-auto rounded-full shadow-lg hover:shadow-xl transition-all"
          variant="default"
        >
          <span className="text-sm font-medium">Share Feedback</span>
          <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary/10">
            <MessageSquarePlus className="h-4 w-4" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-4 w-4">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/30 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-4 w-4 bg-primary/20 text-[10px] font-medium text-primary items-center justify-center">
              β
            </span>
          </span>
        </Button>
      )}
    </div>
  );
} 