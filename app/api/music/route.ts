import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createClient } from '@supabase/supabase-js';
import { logger } from '@/lib/logger';

// Setup Supabase Admin
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const BUCKET_NAME = 'cougan/backsounds'; // Pastikan nama bucket sesuai di Supabase

// 1. GET: Ambil semua daftar musik
export async function GET() {
  try {
    const tracks = await prisma.backsound.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(tracks);
  } catch (error) {
    logger.error({ err: error }, 'Failed to fetch music tracks');
    return NextResponse.json({ error: 'Gagal mengambil data' }, { status: 500 });
  }
}

// 2. POST: Upload Musik (Kode sebelumnya, saya rapikan sedikit)
export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) return NextResponse.json({ error: 'File wajib ada' }, { status: 400 });
    if (file.size > 5 * 1024 * 1024) return NextResponse.json({ error: 'Max 5MB' }, { status: 400 });

    // Hitung total storage terpakai
    const allTracks = await prisma.backsound.findMany({
      select: { size: true },
    });
    const totalSize = allTracks.reduce((acc, track) => acc + track.size, 0);
    const MAX_STORAGE = 100 * 1024 * 1024; // 100 MB

    if (totalSize + file.size > MAX_STORAGE) {
      return NextResponse.json({ error: 'Storage penuh (Max 100MB)' }, { status: 403 });
    }

    // Upload Supabase
    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const { error: uploadError } = await supabase.storage.from(BUCKET_NAME).upload(fileName, Buffer.from(await file.arrayBuffer()), {
      contentType: file.type,
    });

    if (uploadError) throw uploadError;

    // Get URL
    const {
      data: { publicUrl },
    } = supabase.storage.from(BUCKET_NAME).getPublicUrl(fileName);

    // Save DB
    const newTrack = await prisma.backsound.create({
      data: {
        filename: fileName, // Simpan nama file storage untuk delete nanti
        originalName: file.name, // Nama asli untuk display (tambahkan field ini di schema jika mau, atau pakai filename saja)
        url: publicUrl,
        size: file.size,
      },
    });

    return NextResponse.json(newTrack);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Failed to upload music');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// 3. DELETE: Hapus Musik
export async function DELETE(req: Request) {
  try {
    const { id, filename } = await req.json();

    if (!id || !filename) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    // A. Hapus dari Supabase Storage
    const { error: storageError } = await supabase.storage.from(BUCKET_NAME).remove([filename]);

    if (storageError) {
      logger.error({ err: storageError }, 'Storage Delete Error');
      // Lanjut saja biar DB bersih, atau return error terserah preferensi
    }

    // B. Hapus dari Database Prisma
    await prisma.backsound.delete({
      where: { id },
    });

    return NextResponse.json({ message: 'Berhasil dihapus' });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error }, 'Failed to delete music');
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
