import { describe, it, expect, vi } from "vitest";
import { seedDefaultResourcesForUser } from "./seed-default-resources";
import { getDb } from "./db";

// Mock the database module
vi.mock("./db", () => ({
  getDb: vi.fn(),
}));

describe("seedDefaultResourcesForUser", () => {
  it("should handle database unavailability gracefully", async () => {
    vi.mocked(getDb).mockResolvedValue(null);

    // Should not throw
    await expect(seedDefaultResourcesForUser(1)).resolves.not.toThrow();
  });

  it("should skip seeding if user record not found", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([]),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await seedDefaultResourcesForUser(1);

    // Should complete without error
    expect(mockDb.select).toHaveBeenCalled();
  });

  it("should skip seeding if already seeded", async () => {
    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue([
        {
          id: 1,
          hasSeededDefaultResources: true,
        },
      ]),
      insert: vi.fn(),
    };

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await seedDefaultResourcesForUser(1);

    // Should not attempt to insert
    expect(mockDb.insert).not.toHaveBeenCalled();
  });

  it("should skip seeding if user already has resources", async () => {
    const limitMock = vi.fn();
    const insertMock = vi.fn();

    const mockDb = {
      select: vi.fn().mockReturnThis(),
      from: vi.fn().mockReturnThis(),
      where: vi.fn().mockReturnThis(),
      limit: limitMock,
      insert: insertMock,
      update: vi.fn().mockReturnThis(),
      set: vi.fn().mockReturnThis(),
    };

    // First call: user exists, not seeded
    limitMock.mockResolvedValueOnce([
      {
        id: 1,
        hasSeededDefaultResources: false,
      },
    ]);

    // Second call: user has existing resources
    limitMock.mockResolvedValueOnce([
      {
        id: 1,
        title: "Existing Resource",
      },
    ]);

    vi.mocked(getDb).mockResolvedValue(mockDb as any);

    await seedDefaultResourcesForUser(1);

    // Should not attempt to insert new resources
    expect(insertMock).not.toHaveBeenCalled();
  });
});
