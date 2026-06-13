"use server";

import { prisma } from "@/lib/prisma";

export async function getRosterData() {
  const streamers = await prisma.streamer.findMany({
    orderBy: {
      position: 'asc',
    },
  });

  const activeMembers = streamers.filter(s => s.factionStatus === "ACTIVE");
  const alumniMembers = streamers.filter(s => s.factionStatus === "OUT");
  const fallenMembers = streamers.filter(s => s.factionStatus === "CK");

  return {
    activeMembers,
    alumniMembers,
    fallenMembers,
  };
}
