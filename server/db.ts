import { eq, and, asc, count, desc, like, or, sql, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, resources, collections, tags, resourceTags } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

/**
 * Resource queries
 */
export async function getUserResources(userId: number, limit: number = 20, offset: number = 0) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(resources)
    .where(eq(resources.userId, userId))
    .orderBy(desc(resources.createdAt))
    .limit(limit)
    .offset(offset);

  return result;
}

export async function getResourceCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;

  const result = await db
    .select({ count: count() })
    .from(resources)
    .where(eq(resources.userId, userId));

  return result[0]?.count ?? 0;
}

export async function getResourceById(resourceId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createResource(
  userId: number,
  title: string,
  description: string | null,
  contentType: "link" | "text",
  content: string,
  collectionId?: number | null
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify collection ownership if collectionId is provided
  if (collectionId) {
    const collection = await getCollectionById(collectionId, userId);
    if (!collection) {
      throw new Error("Collection not found or does not belong to user");
    }
  }

  const result = await db.insert(resources).values({
    userId,
    title,
    description,
    contentType,
    content,
    collectionId: collectionId ?? null,
  });

  return result[0]?.insertId;
}

export async function updateResource(
  resourceId: number,
  userId: number,
  updates: {
    title?: string;
    description?: string | null;
    contentType?: "link" | "text";
    content?: string;
    collectionId?: number | null;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify collection ownership if collectionId is being updated
  if (updates.collectionId !== undefined && updates.collectionId !== null) {
    const collection = await getCollectionById(updates.collectionId, userId);
    if (!collection) {
      throw new Error("Collection not found or does not belong to user");
    }
  }

  // Verify resource ownership before updating
  const resource = await getResourceById(resourceId, userId);
  if (!resource) {
    throw new Error("Resource not found or does not belong to user");
  }

  await db
    .update(resources)
    .set(updates)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)));
}

export async function deleteResource(resourceId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify resource ownership before deleting
  const resource = await getResourceById(resourceId, userId);
  if (!resource) {
    throw new Error("Resource not found or does not belong to user");
  }

  // Delete associated tags
  await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId));

  // Delete the resource
  await db
    .delete(resources)
    .where(and(eq(resources.id, resourceId), eq(resources.userId, userId)));
}

/**
 * Collection queries
 */
export async function getUserCollections(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(collections)
    .where(eq(collections.userId, userId))
    .orderBy(asc(collections.name));

  return result;
}

export async function getCollectionById(collectionId: number, userId: number) {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)))
    .limit(1);

  return result[0];
}

export async function createCollection(userId: number, name: string, description?: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(collections).values({
    userId,
    name,
    description: description ?? null,
  });

  return result[0]?.insertId;
}

export async function updateCollection(
  collectionId: number,
  userId: number,
  updates: { name?: string; description?: string | null }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify collection ownership before updating
  const collection = await getCollectionById(collectionId, userId);
  if (!collection) {
    throw new Error("Collection not found or does not belong to user");
  }

  await db
    .update(collections)
    .set(updates)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
}

export async function deleteCollection(collectionId: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify collection ownership before deleting
  const collection = await getCollectionById(collectionId, userId);
  if (!collection) {
    throw new Error("Collection not found or does not belong to user");
  }

  // Remove collection from all resources owned by this user
  await db
    .update(resources)
    .set({ collectionId: null })
    .where(and(eq(resources.collectionId, collectionId), eq(resources.userId, userId)));

  // Delete the collection
  await db
    .delete(collections)
    .where(and(eq(collections.id, collectionId), eq(collections.userId, userId)));
}

/**
 * Tag queries
 */
export async function getUserTags(userId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select()
    .from(tags)
    .where(eq(tags.userId, userId))
    .orderBy(asc(tags.name));

  return result;
}

export async function getOrCreateTag(userId: number, tagName: string) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(tags)
    .where(and(eq(tags.userId, userId), eq(tags.name, tagName)))
    .limit(1);

  if (existing.length > 0) {
    return existing[0]!.id;
  }

  const result = await db.insert(tags).values({
    userId,
    name: tagName,
  });

  return result[0]?.insertId;
}

export async function getResourceTags(resourceId: number) {
  const db = await getDb();
  if (!db) return [];

  const result = await db
    .select({ tag: tags })
    .from(resourceTags)
    .innerJoin(tags, eq(resourceTags.tagId, tags.id))
    .where(eq(resourceTags.resourceId, resourceId));

  return result.map((r) => r.tag);
}

export async function setResourceTags(resourceId: number, userId: number, tagIds: number[]) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Verify resource ownership
  const resource = await getResourceById(resourceId, userId);
  if (!resource) {
    throw new Error("Resource not found or does not belong to user");
  }

  // Verify all tags belong to the user
  if (tagIds.length > 0) {
    const userTags = await getUserTags(userId);
    const userTagIds = new Set(userTags.map((t) => t.id));
    for (const tagId of tagIds) {
      if (!userTagIds.has(tagId)) {
        throw new Error("One or more tags do not belong to user");
      }
    }
  }

  // Delete existing tags
  await db.delete(resourceTags).where(eq(resourceTags.resourceId, resourceId));

  // Add new tags
  if (tagIds.length > 0) {
    await db.insert(resourceTags).values(
      tagIds.map((tagId) => ({
        resourceId,
        tagId,
      }))
    );
  }
}

export async function searchResources(
  userId: number,
  keyword?: string,
  tagIds?: number[],
  limit: number = 20,
  offset: number = 0
) {
  const db = await getDb();
  if (!db) return { resources: [], total: 0 };

  // Build where conditions
  const whereConditions: any[] = [eq(resources.userId, userId)];

  if (keyword) {
    whereConditions.push(
      or(
        like(resources.title, `%${keyword}%`),
        like(resources.description, `%${keyword}%`)
      )
    );
  }

  // If tag filtering is needed, join with tags and filter
  if (tagIds && tagIds.length > 0) {
    // Get all resource IDs that have at least one of the specified tags
    const matchingResourceIds = await db
      .selectDistinct({ resourceId: resourceTags.resourceId })
      .from(resourceTags)
      .where(inArray(resourceTags.tagId, tagIds));

    const ids = matchingResourceIds.map((r) => r.resourceId);

    if (ids.length === 0) {
      return { resources: [], total: 0 };
    }

    whereConditions.push(inArray(resources.id, ids));
  }

  // Count total matching resources
  const countResult = await db
    .select({ count: count() })
    .from(resources)
    .where(and(...whereConditions));

  const total = countResult[0]?.count ?? 0;

  // Get paginated results
  const result = await db
    .select()
    .from(resources)
    .where(and(...whereConditions))
    .orderBy(desc(resources.createdAt))
    .limit(limit)
    .offset(offset);

  return { resources: result, total };
}
