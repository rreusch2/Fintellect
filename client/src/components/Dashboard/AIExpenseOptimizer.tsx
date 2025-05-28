import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Loader2 } from 'lucide-react';
import axios from 'axios';
import { toast } from '../../hooks/use-toast';

/**
 * AIExpenseOptimizer is a component that uses the Thrive MCP agent to optimize expenses
 */
const AIExpenseOptimizer: React.FC = () => {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast({
        title: 'Query required',
        description: 'Please enter a question for the expense optimizer',
        variant: 'destructive',
      });
      return;
    }
    
    setLoading(true);
    
    try {
      const { data } = await axios.post('/api/ai/mcp/thrive', { query });
      setResponse(data.result);
    } catch (error) {
      console.error('Error querying Thrive agent:', error);
      toast({
        title: 'Error',
        description: 'Failed to get a response from the expense optimization agent',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gradient-to-r from-purple-500 to-coral-400 text-white">
        <CardTitle className="flex items-center gap-2">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width="24" 
            height="24" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            className="lucide lucide-coins"
          >
            <circle cx="8" cy="8" r="6" />
            <path d="M18.09 10.37A6 6 0 1 1 10.34 18" />
            <path d="M7 6h1v4" />
            <path d="m16.71 13.88.7.71-2.82 2.82" />
          </svg>
          Thrive – Expense Optimizer
        </CardTitle>
        <CardDescription className="text-white text-opacity-90">
          Your practical ally for finding savings opportunities
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="query" className="text-sm font-medium text-gray-700 block mb-1">
              Ask Thrive about your expenses
            </label>
            <Input
              id="query"
              placeholder="e.g., How can I reduce my monthly expenses?"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              disabled={loading}
              className="w-full"
            />
          </div>
          
          <Button 
            type="submit" 
            disabled={loading} 
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing expenses...
              </>
            ) : (
              'Get Optimization Advice'
            )}
          </Button>
        </form>
      
        {response && (
          <div className="mt-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Thrive's Recommendations:
            </h3>
            <div className="bg-purple-50 rounded-md p-4 border border-purple-100">
              <Textarea
                value={response}
                readOnly
                className="min-h-[200px] bg-transparent border-0 p-0 focus-visible:ring-0"
              />
            </div>
          </div>
        )}
      </CardContent>
      
      <CardFooter className="text-xs text-gray-500 flex justify-between">
        <span>Powered by MCP Agent</span>
        <span className="cursor-pointer hover:text-purple-600">View all expense insights</span>
      </CardFooter>
    </Card>
  );
};

export default AIExpenseOptimizer;