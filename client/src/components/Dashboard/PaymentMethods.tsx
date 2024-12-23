import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

interface PaymentMethod {
  id: string;
  type: "card";
  last4: string;
  brand: string;
}

export default function PaymentMethods() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAddingPayment, setIsAddingPayment] = useState(false);

  const { data: paymentMethods = [], isLoading } = useQuery<PaymentMethod[]>({
    queryKey: ["/api/payment-methods"],
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/payment-methods/setup", {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(await response.text());
      }

      // In production, this would return a Stripe setup intent client secret
      return response.json();
    },
    onSuccess: (data) => {
      // In production, this would handle the Stripe Elements flow
      toast({
        title: "Test Mode",
        description: "Payment method added successfully (test mode)",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/payment-methods"] });
      setIsAddingPayment(false);
    },
    onError: (error: Error) => {
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message,
      });
    },
  });

  const handleAddPayment = () => {
    addPaymentMethodMutation.mutate();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Payment Methods</CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={handleAddPayment}
          disabled={isAddingPayment}
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Payment Method
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading payment methods...</div>
        ) : paymentMethods.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No payment methods added yet
          </div>
        ) : (
          <div className="space-y-4">
            {paymentMethods.map((method) => (
              <div
                key={method.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <p className="font-medium capitalize">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-muted-foreground capitalize">
                      {method.type}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
