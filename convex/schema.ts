import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({

  // ─── USERS ────────────────────────────────────────────────────
  users: defineTable({
    externalId: v.string(),
    name: v.string(),
    email: v.string(),
    imageUrl: v.optional(v.string()),
    // Account type — NOT class role. A user can be teacher in one class
    // and student in another. Class-level role lives in class_members.
    accountType: v.union(
      v.literal("personal"),       // normal signup — can create/join classes freely
      v.literal("institutional"),  // university/org account — admin controls features
      v.literal("admin")          // platform superadmin
    ),
    isActive: v.optional(v.boolean()),
    createdAt: v.number(),
  })
    .index("byExternalId", ["externalId"])
    .index("byAccountType", ["accountType"]),

  // ─── CLASSES ──────────────────────────────────────────────────
  classes: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    inviteCode: v.string(),
    isInstitutional: v.boolean(),
    allowedDomain: v.optional(v.string()),  // e.g. "@university.edu"
    isArchived: v.boolean(),
    createdAt: v.number(),
  })
    .index("byOwnerId", ["ownerId"])
    .index("byInviteCode", ["inviteCode"]),

  // ─── CLASS MEMBERS ────────────────────────────────────────────
  // Role lives HERE — same person can be teacher in one class
  // and student in another, just like Google Classroom.
  class_members: defineTable({
    classId: v.id("classes"),
    userId: v.id("users"),
    role: v.union(
      v.literal("teacher"),   // created the class or added as co-teacher
      v.literal("student")    // joined via invite code
    ),
    joinedAt: v.number(),
  })
    .index("byClassId", ["classId"])
    .index("byUserId", ["userId"])
    .index("byClassAndUser", ["classId", "userId"]),

  // ─── QUIZZES ──────────────────────────────────────────────────
  quizzes: defineTable({
    userId: v.id("users"),
    classId: v.optional(v.id("classes")),
    prompt: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    timeLimitSeconds: v.optional(v.number()),
    availableFrom: v.optional(v.number()),
    availableTo: v.optional(v.number()),
    allowUnlimitedAttempts: v.boolean(),
    maxAttempts: v.optional(v.number()),
    isPublished: v.boolean(),
    isPublic: v.boolean(),
    accessCode: v.string(),
    accessLink: v.string(),
    createdAt: v.number(),
  })
    .index("byUserId", ["userId"])
    .index("byClassId", ["classId"])
    .index("byAccessCode", ["accessCode"])
    .index("byAccessLink", ["accessLink"]),

  // ─── QUESTIONS ────────────────────────────────────────────────
  // Options embedded as array — no separate options table needed
  questions: defineTable({
    quizId: v.id("quizzes"),
    question: v.string(),
    explanation: v.string(),
    answer: v.string(),
    orderIndex: v.number(),
    options: v.array(
      v.object({
        text: v.string(),
        isCorrect: v.boolean(),
      })
    ),
  })
    .index("byQuizId", ["quizId"]),

  // ─── QUIZ ATTEMPTS ────────────────────────────────────────────
  // Answers embedded — no separate attempt_answers table
  quiz_attempts: defineTable({
    quizId: v.id("quizzes"),
    studentId: v.id("users"),
    isPractice: v.boolean(),
    score: v.number(),
    percentage: v.number(),
    startedAt: v.number(),
    submittedAt: v.optional(v.number()),
    answers: v.array(
      v.object({
        questionId: v.id("questions"),
        selectedOptionText: v.string(),
        isCorrect: v.boolean(),
      })
    ),
  })
    .index("byStudentId", ["studentId"])
    .index("byQuizId", ["quizId"])
    .index("byStudentAndQuiz", ["studentId", "quizId"]),

});
