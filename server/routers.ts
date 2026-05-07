import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getUserResources,
  getResourceCount,
  getResourceById,
  createResource,
  updateResource,
  deleteResource,
  getUserCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  getUserTags,
  getResourceTags,
  setResourceTags,
  searchResources,
} from "./db";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  resources: router({
    list: protectedProcedure
      .input(
        z.object({
          limit: z.number().int().positive().default(20),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        const resources = await getUserResources(ctx.user.id, input.limit, input.offset);
        const total = await getResourceCount(ctx.user.id);
        return { resources, total };
      }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const resource = await getResourceById(input.id, ctx.user.id);
        if (!resource) {
          throw new Error("Resource not found");
        }
        const tags = await getResourceTags(input.id);
        return { ...resource, tags };
      }),

    create: protectedProcedure
      .input(
        z.object({
          title: z.string().min(1).max(255),
          description: z.string().optional().nullable(),
          contentType: z.enum(["link", "text"]),
          content: z.string().min(1),
          collectionId: z.number().int().positive().optional().nullable(),
          tagIds: z.array(z.number().int().positive()).default([]),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const resourceId = await createResource(
          ctx.user.id,
          input.title,
          input.description ?? null,
          input.contentType,
          input.content,
          input.collectionId ?? null
        );

        if (input.tagIds.length > 0) {
          await setResourceTags(resourceId!, ctx.user.id, input.tagIds);
        }

        return { id: resourceId };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          title: z.string().min(1).max(255).optional(),
          description: z.string().optional().nullable(),
          contentType: z.enum(["link", "text"]).optional(),
          content: z.string().min(1).optional(),
          collectionId: z.number().int().positive().optional().nullable(),
          tagIds: z.array(z.number().int().positive()).optional(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, tagIds, ...updates } = input;
        await updateResource(id, ctx.user.id, updates);

        if (tagIds) {
          await setResourceTags(id, ctx.user.id, tagIds);
        }

        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteResource(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  collections: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserCollections(ctx.user.id);
    }),

    get: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .query(async ({ ctx, input }) => {
        const collection = await getCollectionById(input.id, ctx.user.id);
        if (!collection) {
          throw new Error("Collection not found");
        }
        return collection;
      }),

    create: protectedProcedure
      .input(
        z.object({
          name: z.string().min(1).max(255),
          description: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const id = await createCollection(ctx.user.id, input.name, input.description ?? undefined);
        return { id };
      }),

    update: protectedProcedure
      .input(
        z.object({
          id: z.number().int().positive(),
          name: z.string().min(1).max(255).optional(),
          description: z.string().optional().nullable(),
        })
      )
      .mutation(async ({ ctx, input }) => {
        const { id, ...updates } = input;
        await updateCollection(id, ctx.user.id, updates);
        return { success: true };
      }),

    delete: protectedProcedure
      .input(z.object({ id: z.number().int().positive() }))
      .mutation(async ({ ctx, input }) => {
        await deleteCollection(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  tags: router({
    list: protectedProcedure.query(async ({ ctx }) => {
      return await getUserTags(ctx.user.id);
    }),

    suggest: protectedProcedure
      .input(z.object({ query: z.string().optional() }))
      .query(async ({ ctx, input }) => {
        const allTags = await getUserTags(ctx.user.id);
        if (!input.query) return allTags;
        return allTags.filter((tag) =>
          tag.name.toLowerCase().includes(input.query!.toLowerCase())
        );
      }),
  }),

  search: router({
    query: protectedProcedure
      .input(
        z.object({
          keyword: z.string().optional(),
          tagIds: z.array(z.number().int().positive()).optional(),
          limit: z.number().int().positive().default(20),
          offset: z.number().int().nonnegative().default(0),
        })
      )
      .query(async ({ ctx, input }) => {
        return await searchResources(
          ctx.user.id,
          input.keyword,
          input.tagIds,
          input.limit,
          input.offset
        );
      }),
  }),
});

export type AppRouter = typeof appRouter;
