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

export async function postAdminMessage(formData: FormData) {
  try {
    const parentId = formData.get("parentId") as string | null;
    const message = formData.get("message") as string;

    if (!message) {
      return { success: false, error: "Message is required" };
    }

    const reply = await prisma.discussion.create({
      data: {
        name: "COUGAN SYSTEM",
        message: message,
        isAdmin: true,
        parentId: parentId || null,
      },
    });

    revalidatePaths();
    return { success: true, data: reply };
  } catch (error) {
    console.error("Failed to post admin message:", error);
    return { success: false, error: "Failed to post admin message" };
  }
}

export async function deleteDiscussion(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "ID is required" };

    await prisma.discussion.delete({
      where: { id },
    });

    revalidatePaths();
    return { success: true };
  } catch (error) {
    console.error("Failed to delete discussion:", error);
    return { success: false, error: "Failed to delete discussion" };
  }
}

export async function togglePinDiscussion(formData: FormData) {
  try {
    const id = formData.get("id") as string;
    if (!id) return { success: false, error: "ID is required" };

    const discussion = await prisma.discussion.findUnique({ where: { id } });
    if (!discussion) return { success: false, error: "Discussion not found" };

    const updated = await prisma.discussion.update({
      where: { id },
      data: { isPinned: !discussion.isPinned },
    });

    revalidatePaths();
    return { success: true, data: updated };
  } catch (error) {
    console.error("Failed to toggle pin:", error);
    return { success: false, error: "Failed to toggle pin" };
  }
}

function revalidatePaths() {
  revalidatePath("/");
  revalidatePath("/admin/discussion");
}
