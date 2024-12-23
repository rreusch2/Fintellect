import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CalendarClock, AlertCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface RecurringExpense {
  merchantName: string;
  category: string;
  averageAmount: number;
  frequency: string;
  lastCharged: string;
}

interface Props {
  expenses: RecurringExpense[];
}

export default function RecurringExpenses({ expenses }: Props) {
  if (!expenses?.length) return null;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <CardTitle>Recurring Expenses</CardTitle>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              <Badge variant="secondary" className="ml-2">
                {expenses.length} subscriptions
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p>Regular payments identified from your transaction history</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Frequency</TableHead>
              <TableHead>Last Charged</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {expenses.map((expense, index) => (
              <TableRow key={index}>
                <TableCell className="font-medium">{expense.merchantName}</TableCell>
                <TableCell>{expense.category}</TableCell>
                <TableCell>${(expense.averageAmount / 100).toFixed(2)}</TableCell>
                <TableCell>{expense.frequency}</TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(expense.lastCharged).toLocaleDateString()}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
          <AlertCircle className="h-4 w-4" />
          <p>
            Monthly total:{" "}
            <span className="font-medium text-foreground">
              ${(expenses.reduce((sum, exp) => sum + exp.averageAmount, 0) / 100).toFixed(2)}
            </span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
