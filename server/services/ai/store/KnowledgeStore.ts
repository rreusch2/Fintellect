import { db } from "@db";
import { plaidTransactions, goals, insights, users } from "@db/schema";
import { eq, desc } from "drizzle-orm";

interface Transaction {
  id: number;
  amount: number;
  category: string;
  date: Date;
  merchantName: string;
  description?: string;
}

interface Goal {
  id: number;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: Date;
  category: string;
  status: 'in_progress' | 'completed' | 'paused';
}

export interface Insight {
  id: number;
  type: 'action' | 'tip';
  category: string;
  finding: string;
  description: string;
  impact?: {
    monthly: number;
    yearly: number;
  };
}

export interface UserContext {
  userId: number;
  recentTransactions: Transaction[];
  activeGoals: Goal[];
  previousInsights: Insight[];
  lastInteraction?: Date;
  monthlyIncome?: number;
  hasPlaidSetup?: boolean;
  userProfile?: {
    monthlyIncome: number;
    hasPlaidSetup: boolean;
    hasCompletedOnboarding: boolean;
  };
}

// Singleton pattern for shared knowledge store
class KnowledgeStore {
  private static instance: KnowledgeStore;
  private contextCache: Map<number, UserContext>;
  private lastUpdate: Map<number, Date>;
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  private constructor() {
    this.contextCache = new Map();
    this.lastUpdate = new Map();
  }

  public static getInstance(): KnowledgeStore {
    if (!KnowledgeStore.instance) {
      KnowledgeStore.instance = new KnowledgeStore();
    }
    return KnowledgeStore.instance;
  }

  private async loadUserData(userId: number): Promise<UserContext> {
    const [userTransactions, userGoals, userInsights, userData] = await Promise.all([
      db.select()
        .from(plaidTransactions)
        .where(eq(plaidTransactions.userId, userId))
        .orderBy(desc(plaidTransactions.date))
        .limit(20),
      db.select()
        .from(goals)
        .where(eq(goals.userId, userId))
        .orderBy(desc(goals.createdAt)),
      db.select()
        .from(insights)
        .where(eq(insights.userId, userId))
        .orderBy(desc(insights.createdAt))
        .limit(5),
      db.select()
        .from(users)
        .where(eq(users.id, userId))
        .limit(1)
    ]);

    // Map transactions to our Transaction interface
    const mappedTransactions: Transaction[] = userTransactions.map(t => ({
      id: t.id,
      amount: t.amount,
      category: t.category || 'uncategorized',
      date: t.date,
      merchantName: t.merchantName || 'Unknown Merchant',
      description: t.description || undefined
    }));

    // Map goals to our Goal interface
    const mappedGoals: Goal[] = userGoals.map(g => ({
      id: g.id,
      name: g.name,
      targetAmount: g.targetAmount,
      currentAmount: g.currentAmount,
      deadline: g.deadline || undefined,
      category: g.category,
      status: g.status as 'in_progress' | 'completed' | 'paused'
    }));

    // Map insights to our Insight interface
    const mappedInsights: Insight[] = userInsights.map(i => ({
      id: i.id,
      type: i.type as 'action' | 'tip',
      category: 'general',
      finding: i.finding || '',
      description: i.description || '',
      impact: undefined
    }));

    return {
      userId,
      recentTransactions: mappedTransactions,
      activeGoals: mappedGoals,
      previousInsights: mappedInsights,
      lastInteraction: new Date(),
      monthlyIncome: userData[0]?.monthlyIncome,
      hasPlaidSetup: userData[0]?.hasPlaidSetup
    };
  }

  public async getUserContext(userId: number): Promise<UserContext> {
    const now = new Date();
    const lastUpdate = this.lastUpdate.get(userId);
    
    if (!lastUpdate || now.getTime() - lastUpdate.getTime() > this.CACHE_TTL) {
      const context = await this.loadUserData(userId);
      this.contextCache.set(userId, context);
      this.lastUpdate.set(userId, now);
      return context;
    }

    return this.contextCache.get(userId)!;
  }

  public async updateUserContext(userId: number, partialContext: Partial<UserContext>) {
    const currentContext = await this.getUserContext(userId);
    const updatedContext = {
      ...currentContext,
      ...partialContext,
      lastInteraction: new Date()
    };
    
    this.contextCache.set(userId, updatedContext);
    this.lastUpdate.set(userId, new Date());
  }

  public clearUserContext(userId: number) {
    this.contextCache.delete(userId);
    this.lastUpdate.delete(userId);
  }
}

export const knowledgeStore = KnowledgeStore.getInstance();
