import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock user context
const mockUser = {
  id: 1,
  openId: "test-user",
  email: "test@example.com",
  name: "Test User",
  loginMethod: "manus",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
};

function createMockContext(user = mockUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {} as TrpcContext["res"],
  };
}

describe("Resources Router", () => {
  describe("resources.create", () => {
    it("should create a resource with title, description, and content", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.resources.create({
        title: "Test Link",
        description: "A test resource",
        contentType: "link",
        content: "https://example.com",
        tagIds: [],
      });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("number");
    });

    it("should require a title", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.resources.create({
          title: "",
          description: "A test resource",
          contentType: "link",
          content: "https://example.com",
          tagIds: [],
        })
      ).rejects.toThrow();
    });

    it("should require content", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.resources.create({
          title: "Test",
          description: "A test resource",
          contentType: "link",
          content: "",
          tagIds: [],
        })
      ).rejects.toThrow();
    });
  });

  describe("resources.list", () => {
    it("should return list of resources", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.resources.list({
        limit: 10,
        offset: 0,
      });

      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);
      expect(result.total).toBeGreaterThanOrEqual(0);
    });

    it("should respect pagination limits", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Create multiple resources
      for (let i = 0; i < 5; i++) {
        await caller.resources.create({
          title: `Resource ${i}`,
          description: "Test",
          contentType: "text",
          content: `Content ${i}`,
          tagIds: [],
        });
      }

      const result = await caller.resources.list({
        limit: 2,
        offset: 0,
      });

      expect(result.resources.length).toBeLessThanOrEqual(2);
      expect(result.total).toBeGreaterThanOrEqual(5);
    });
  });

  describe("resources.delete", () => {
    it("should delete a resource", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const created = await caller.resources.create({
        title: "To Delete",
        description: "Test",
        contentType: "link",
        content: "https://example.com",
        tagIds: [],
      });

      const deleteResult = await caller.resources.delete({
        id: created.id!,
      });

      expect(deleteResult.success).toBe(true);
    });

    it("should prevent deletion of other user's resources", async () => {
      const ctx1 = createMockContext();
      const ctx2 = createMockContext({ ...mockUser, id: 2, openId: "other-user" });

      const caller1 = appRouter.createCaller(ctx1);
      const caller2 = appRouter.createCaller(ctx2);

      const created = await caller1.resources.create({
        title: "User 1 Resource",
        description: "Test",
        contentType: "link",
        content: "https://example.com",
        tagIds: [],
      });

      await expect(caller2.resources.delete({ id: created.id! })).rejects.toThrow();
    });
  });
});

describe("Collections Router", () => {
  describe("collections.create", () => {
    it("should create a collection", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.collections.create({
        name: "My Collection",
        description: "A test collection",
      });

      expect(result.id).toBeDefined();
      expect(typeof result.id).toBe("number");
    });

    it("should require a name", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await expect(
        caller.collections.create({
          name: "",
          description: "Test",
        })
      ).rejects.toThrow();
    });
  });

  describe("collections.list", () => {
    it("should return collections for the user", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await caller.collections.create({
        name: "Collection 1",
        description: "Test",
      });

      const result = await caller.collections.list();

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});

describe("Tags Router", () => {
  describe("tags.list", () => {
    it("should return empty list for user with no tags", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tags.list();

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return tags created through resources", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      // Create a resource with tags
      await caller.resources.create({
        title: "Tagged Resource",
        description: "Test",
        contentType: "text",
        content: "Content",
        tagIds: [],
      });

      const result = await caller.tags.list();

      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("tags.suggest", () => {
    it("should suggest tags based on query", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tags.suggest({
        query: "test",
      });

      expect(Array.isArray(result)).toBe(true);
    });

    it("should return empty list for non-matching query", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.tags.suggest({
        query: "nonexistenttagquery12345",
      });

      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});

describe("Search Router", () => {
  describe("search.query", () => {
    it("should search resources by keyword", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      await caller.resources.create({
        title: "Searchable Resource",
        description: "This is a test resource",
        contentType: "text",
        content: "Test content",
        tagIds: [],
      });

      const result = await caller.search.query({
        keyword: "Searchable",
        limit: 10,
        offset: 0,
      });

      expect(result.resources).toBeDefined();
      expect(Array.isArray(result.resources)).toBe(true);
    });

    it("should return empty results for non-matching keyword", async () => {
      const ctx = createMockContext();
      const caller = appRouter.createCaller(ctx);

      const result = await caller.search.query({
        keyword: "nonexistentresource12345",
        limit: 10,
        offset: 0,
      });

      expect(result.resources).toBeDefined();
      expect(result.resources.length).toBe(0);
    });
  });
});
