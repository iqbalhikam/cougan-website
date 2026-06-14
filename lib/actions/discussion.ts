"use server";

import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function getDiscussions() {
  try {
    const discussions = await prisma.discussion.findMany({
      where: {
        parentId: null,
      },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        replies: {
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });
    return discussions;
  } catch (error) {
    console.error("Failed to fetch discussions:", error);
    return [];
  }
}

export async function getThreads() {
  try {
    const threads = await prisma.discussion.findMany({
      where: { parentId: null },
      orderBy: [
        { isPinned: "desc" },
        { createdAt: "desc" }
      ],
      include: {
        _count: {
          select: { replies: true }
        }
      }
    });
    return threads;
  } catch (error) {
    console.error("Failed to fetch threads:", error);
    return [];
  }
}

export async function getThreadReplies(threadId: string) {
  try {
    const thread = await prisma.discussion.findUnique({
      where: { id: threadId },
      include: {
        replies: {
          orderBy: { createdAt: "asc" }
        }
      }
    });
    return thread;
  } catch (error) {
    console.error("Failed to fetch thread replies:", error);
    return null;
  }
}

export async function createThread(title: string, message: string, name: string, username?: string) {
  try {
    if (!title || !message || !name) {
      return { success: false, error: "Title, name and message are required" };
    }
    const thread = await prisma.discussion.create({
      data: {
        title,
        message,
        name,
        username: username || null,
        isAdmin: false,
        parentId: null,
      }
    });
    revalidatePaths();
    return { success: true, data: thread };
  } catch (error) {
    console.error("Failed to create thread:", error);
    return { success: false, error: "Failed to create thread" };
  }
}

export async function replyToThread(threadId: string, message: string, name: string, username?: string) {
  try {
    if (!message || !name || !threadId) {
      return { success: false, error: "Message, name and threadId are required" };
    }
    const reply = await prisma.discussion.create({
      data: {
        message,
        name,
        username: username || null,
        isAdmin: false,
        parentId: threadId,
      }
    });
    revalidatePaths();
    return { success: true, data: reply };
  } catch (error) {
    console.error("Failed to reply to thread:", error);
    return { success: false, error: "Failed to reply to thread" };
  }
}

export async function postPublicDiscussion(formData: FormData) {
  try {
    const name = formData.get("name") as string;
    const username = formData.get("username") as string | null;
    const message = formData.get("message") as string;
    const parentId = formData.get("parentId") as string | null;

    if (!name || !message) {
      return { success: false, error: "Name and message are required" };
    }

    const discussion = await prisma.discussion.create({
      data: {
        name,
        username: username || null,
        message,
        isAdmin: false,
        parentId: parentId || null,
      },
    });

    revalidatePaths();
    return { success: true, data: discussion };
  } catch (error) {
    console.error("Failed to post discussion:", error);
    return { success: false, error: "Failed to post discussion" };
  }
}

function revalidatePaths() {
  revalidatePath("/");
}

export async function toggleReaction(messageId: string, emoji: string, username: string) {
  try {
    const discussion = await prisma.discussion.findUnique({
      where: { id: messageId },
    });

    if (!discussion) {
      return { success: false, error: "Discussion not found" };
    }

    // Parse reactions, default to empty object
    const reactions = discussion.reactions && typeof discussion.reactions === "object" 
      ? discussion.reactions as Record<string, string[]> 
      : {};

    const usersForEmoji = reactions[emoji] || [];
    
    let newUsersForEmoji;
    if (usersForEmoji.includes(username)) {
      // Unlike
      newUsersForEmoji = usersForEmoji.filter(u => u !== username);
    } else {
      // Like
      newUsersForEmoji = [...usersForEmoji, username];
    }

    // Update reactions object
    const newReactions = { ...reactions };
    if (newUsersForEmoji.length === 0) {
      delete newReactions[emoji];
    } else {
      newReactions[emoji] = newUsersForEmoji;
    }

    const updated = await prisma.discussion.update({
      where: { id: messageId },
      data: { reactions: newReactions },
    });

    revalidatePaths();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle reaction:", error);
    return { success: false, error: "Failed to toggle reaction" };
  }
}

export async function getStickers() {
  try {
    const stickers = await prisma.customSticker.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return stickers;
  } catch (error) {
    console.error("Failed to fetch stickers:", error);
    return [];
  }
}
