import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('Migrating all streamers to roleId "0"...');

    // Ensure Role "0" exists
    let role0 = await prisma.role.findUnique({ where: { id: '0' } });
    if (!role0) {
      // If it doesn't exist, try creating it. But user said they added it.
      // We can create it just in case if safe.
      // OR better, trust the user. But checking is safer.
      console.log('Role 0 not found via prisma (maybe it was added manually in DB directly?). Attempting to create if missing.');
      try {
        role0 = await prisma.role.create({
          data: { id: '0', name: 'Default' },
        });
      } catch (e) {
        console.log('Role 0 creation failed (likely exists):', e);
      }
    }

    const result = await prisma.streamer.updateMany({
      data: { roleId: '0' },
    });

    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error('Migration failed:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
