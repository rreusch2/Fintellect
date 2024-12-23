import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2 as Bank, CreditCard, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlaid } from "@/hooks/use-plaid";

export default function BankAccounts() {
  const { accounts, isLoading, openPlaidLink } = usePlaid();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Linked Accounts</CardTitle>
        <Button variant="outline" size="sm" onClick={openPlaidLink}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-center py-4">Loading accounts...</div>
        ) : accounts.length === 0 ? (
          <div className="text-center py-4 text-muted-foreground">
            No accounts linked yet
          </div>
        ) : (
          <div className="space-y-4">
            {accounts.map((account) => (
              <AccountCard key={account.id} {...account} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit";
  balance: number;
}

function AccountCard({ name, type, balance }: Account) {
  const icons = {
    checking: <Bank className="h-5 w-5" />,
    savings: <Bank className="h-5 w-5" />,
    credit: <CreditCard className="h-5 w-5" />,
  };

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="flex items-center gap-3">
        {icons[type]}
        <div>
          <p className="font-medium">{name}</p>
          <p className="text-sm text-muted-foreground capitalize">{type}</p>
        </div>
      </div>
      <p className="font-semibold">
        ${typeof balance === 'number' ? (balance / 100).toFixed(2) : '0.00'}
      </p>
    </div>
  );
}
