"use server";

import { prisma } from "@/lib/prisma";

export async function getCustomStickers() {
  try {
    const stickers = await prisma.customSticker.findMany({
      orderBy: { createdAt: "desc" },
    });
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseBaseUrl = `${supabaseUrl}/storage/v1/object/public/cougan/`;
    return stickers.map(s => ({
      ...s,
      imageUrl: s.imageUrl.startsWith(supabaseBaseUrl) 
        ? s.imageUrl.replace(supabaseBaseUrl, "/cdn/") 
        : s.imageUrl
    }));
  } catch (error) {
    console.error("Failed to fetch custom stickers:", error);
    return [];
  }
}
