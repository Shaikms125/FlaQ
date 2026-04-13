import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ─── CREATE CLASS ───────────────────────────────────────────────

export const createClass = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    isInstitutional: v.boolean(),
    allowedDomain: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    // Generate a unique 6-character invite code
    const inviteCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const classId = await ctx.db.insert("classes", {
      ownerId: user._id,
      name: args.name,
      description: args.description,
      inviteCode,
      isInstitutional: args.isInstitutional,
      allowedDomain: args.allowedDomain,
      isArchived: false,
      createdAt: Date.now(),
    });

    // Creator is auto-added as teacher
    await ctx.db.insert("class_members", {
      classId,
      userId: user._id,
      role: "teacher",
      joinedAt: Date.now(),
    });

    return classId;
  },
});

// ─── JOIN CLASS ─────────────────────────────────────────────────

export const joinClass = mutation({
  args: { inviteCode: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const targetClass = await ctx.db
      .query("classes")
      .withIndex("byInviteCode", (q) => q.eq("inviteCode", args.inviteCode))
      .unique();
    if (!targetClass) throw new Error("Invalid invite code");
    if (targetClass.isArchived) throw new Error("This class has been archived");

    // Domain restriction for institutional classes
    if (targetClass.isInstitutional && targetClass.allowedDomain) {
      if (!user.email.endsWith(targetClass.allowedDomain)) {
        throw new Error(
          `This class is restricted to ${targetClass.allowedDomain} email addresses`
        );
      }
    }

    // Check if already a member
    const existing = await ctx.db
      .query("class_members")
      .withIndex("byClassAndUser", (q) =>
        q.eq("classId", targetClass._id).eq("userId", user._id)
      )
      .unique();
    if (existing) throw new Error("Already a member of this class");

    await ctx.db.insert("class_members", {
      classId: targetClass._id,
      userId: user._id,
      role: "student",
      joinedAt: Date.now(),
    });

    return targetClass._id;
  },
});

// ─── LEAVE CLASS ────────────────────────────────────────────────

export const leaveClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const membership = await ctx.db
      .query("class_members")
      .withIndex("byClassAndUser", (q) =>
        q.eq("classId", args.classId).eq("userId", user._id)
      )
      .unique();
    if (!membership) throw new Error("Not a member of this class");

    // Prevent the owner from leaving their own class
    const targetClass = await ctx.db.get(args.classId);
    if (targetClass && targetClass.ownerId === user._id) {
      throw new Error("Class owner cannot leave. Archive the class instead.");
    }

    await ctx.db.delete(membership._id);
  },
});

// ─── GET MY CLASSES ─────────────────────────────────────────────

export const getMyClasses = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) return [];

    // Get all class memberships for this user
    const memberships = await ctx.db
      .query("class_members")
      .withIndex("byUserId", (q) => q.eq("userId", user._id))
      .collect();

    // Fetch the class details for each membership
    const classes = await Promise.all(
      memberships.map(async (m) => {
        const classDoc = await ctx.db.get(m.classId);
        if (!classDoc || classDoc.isArchived) return null;
        return {
          ...classDoc,
          myRole: m.role,
        };
      })
    );

    return classes.filter(Boolean);
  },
});

// ─── ARCHIVE CLASS ──────────────────────────────────────────────

export const archiveClass = mutation({
  args: { classId: v.id("classes") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated");

    const user = await ctx.db
      .query("users")
      .withIndex("byExternalId", (q) => q.eq("externalId", identity.subject))
      .unique();
    if (!user) throw new Error("User not found");

    const targetClass = await ctx.db.get(args.classId);
    if (!targetClass || targetClass.ownerId !== user._id) {
      throw new Error("Unauthorized — only the class owner can archive");
    }

    await ctx.db.patch(args.classId, { isArchived: true });
  },
});
