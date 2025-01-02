import { db } from "@/db";
import { featureRequests } from "@/db/schema";
import { eq } from "drizzle-orm";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const data = await req.json();
  
  await db.insert(featureRequests).values({
    userId: user.id,
    title: data.title,
    description: data.description,
    useCase: data.useCase,
    status: 'pending',
  });

  return new Response(JSON.stringify({ success: true }));
}

export async function GET(req: Request) {
  const user = await getUserFromRequest(req);
  if (!user?.isAdmin) {
    return new Response("Unauthorized", { status: 401 });
  }

  const requests = await db
    .select()
    .from(featureRequests)
    .orderBy(featureRequests.timestamp, "desc");

  return new Response(JSON.stringify(requests));
} 