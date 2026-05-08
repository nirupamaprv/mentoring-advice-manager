import { getDb } from "./db";
import { resources, tags, resourceTags, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

/**
 * Default resources to seed for new users
 * These are curated articles about reading, learning, and professional communication
 */
const DEFAULT_RESOURCES = [
  {
    title: "10 Short Books Under 200 Pages",
    description: "A curated list of inspiring short books that deliver profound insights without requiring months to read.",
    contentType: "link" as const,
    content: "https://medium.com/nirus-notes/10-short-books-under-200-pages-996b8ce90327?sk=06fcb6d37dab7eb339cb5b8d4c319c1d",
    tags: ["reading", "books", "learning"],
  },
  {
    title: "5 Categories of Books to Re-read",
    description: "Discover which types of books are worth revisiting multiple times to deepen your understanding and gain new perspectives.",
    contentType: "link" as const,
    content: "https://medium.com/nirus-notes/5-categories-of-books-to-re-read-96e9da617ab3?sk=c66e69674888c751858619dbdfe9684c",
    tags: ["reading", "books", "learning"],
  },
  {
    title: "Reading Gamification: Continuous Scrolling",
    description: "Learn how to use gamification techniques to build consistent reading habits and make learning more engaging.",
    contentType: "link" as const,
    content: "https://medium.com/nirus-notes/reading-gamification-continuous-scrolling-bc0186f36039?sk=302a687e0f44833fc03fab311f83e852",
    tags: ["reading", "habits", "gamification"],
  },
  {
    title: "How to Study Online Courses Effectively",
    description: "Practical tips and strategies for getting the most out of online learning, from note-taking to retention techniques.",
    contentType: "link" as const,
    content: "https://medium.com/nirus-notes/how-to-study-online-courses-effectively-6cf19a7eb40?sk=69cb3213c152ae1039b56fae006c67a2",
    tags: ["learning", "online-courses", "study-tips"],
  },
  {
    title: "Framework for Answering Questions to Executives",
    description: "A short and effective framework for crafting clear, concise answers when communicating with senior leaders or highly placed individuals.",
    contentType: "link" as const,
    content: "https://www.instagram.com/p/DVtsx3fAfuK/",
    tags: ["communication", "executive-presence", "framework"],
  },
];

/**
 * Seeds default resources for a new user (only once on first login)
 * Uses hasSeededDefaultResources flag to prevent re-seeding
 * Only seeds truly new users who have no existing resources
 */
export async function seedDefaultResourcesForUser(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.warn("[Seed] Database not available");
    return;
  }

  try {
    // Check if user has already been seeded
    const userRecord = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!userRecord[0] || userRecord[0].hasSeededDefaultResources) {
      if (userRecord[0]?.hasSeededDefaultResources) {
        console.log(`[Seed] User ${userId} already has default resources seeded, skipping`);
      }
      return;
    }

    // Check if user already has resources (existing users shouldn't be seeded)
    const existingResources = await db
      .select()
      .from(resources)
      .where(eq(resources.userId, userId))
      .limit(1);

    if (existingResources.length > 0) {
      // Mark as seeded to prevent future attempts
      await db
        .update(users)
        .set({ hasSeededDefaultResources: true })
        .where(eq(users.id, userId));
      console.log(`[Seed] User ${userId} already has resources, skipping seed (existing user)`);
      return;
    }

    // Create or get tags for this user
    const tagMap = new Map<string, number>();

    for (const resource of DEFAULT_RESOURCES) {
      for (const tagName of resource.tags) {
        if (!tagMap.has(tagName)) {
          // Check if tag already exists
          const existingTag = await db
            .select()
            .from(tags)
            .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
            .limit(1);

          let tagId: number;
          if (existingTag.length > 0) {
            tagId = existingTag[0].id;
          } else {
            const insertResult = await db.insert(tags).values({
              userId,
              name: tagName,
            });
            tagId = insertResult[0]?.insertId as number;
          }

          tagMap.set(tagName, tagId);
        }
      }
    }

    // Create resources
    for (const resource of DEFAULT_RESOURCES) {
      const insertResult = await db.insert(resources).values({
        userId,
        title: resource.title,
        description: resource.description,
        contentType: resource.contentType,
        content: resource.content,
      });

      const resourceId = insertResult[0]?.insertId as number;

      // Link tags to resource
      for (const tagName of resource.tags) {
        const tagId = tagMap.get(tagName);
        if (tagId) {
          await db.insert(resourceTags).values({
            resourceId,
            tagId,
          });
        }
      }
    }

    // Mark user as seeded
    await db
      .update(users)
      .set({ hasSeededDefaultResources: true })
      .where(eq(users.id, userId));

    console.log(`[Seed] Successfully seeded ${DEFAULT_RESOURCES.length} default resources for user ${userId}`);
  } catch (error) {
    console.error("[Seed] Failed to seed default resources:", error);
    throw error;
  }
}
