import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { supabaseAdmin, CHAMPION_IMAGES_BUCKET } from '@/lib/supabase';

const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_SIZE_MB = 5;

// PATCH /api/weeks/[id]/champion-image
// Sube una imagen al bucket de Supabase y guarda la URL en la semana
export async function PATCH(request, { params }) {
  try {
    const { id } = await params;
    const weekId = Number.parseInt(id);

    if (!weekId) {
      return NextResponse.json({ error: 'ID de semana inválido' }, { status: 400 });
    }

    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get('image');

    if (!file) {
      return NextResponse.json({ error: 'No se proporcionó ninguna imagen' }, { status: 400 });
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Formato no soportado. Usá JPG, PNG o WebP.' },
        { status: 400 }
      );
    }

    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      return NextResponse.json(
        { error: `La imagen no puede superar ${MAX_SIZE_MB}MB` },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const ext = file.type.split('/')[1];
    const filename = `week-${weekId}-champion.${ext}`;

    // Si ya existe una imagen anterior, la eliminamos antes de subir la nueva
    if (week.championImage) {
      const oldFilename = week.championImage.split('/').pop();
      await supabaseAdmin.storage.from(CHAMPION_IMAGES_BUCKET).remove([oldFilename]);
    }

    const { error: uploadError } = await supabaseAdmin.storage
      .from(CHAMPION_IMAGES_BUCKET)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return NextResponse.json({ error: 'Error al subir la imagen' }, { status: 500 });
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(CHAMPION_IMAGES_BUCKET)
      .getPublicUrl(filename);

    const updated = await prisma.week.update({
      where: { id: weekId },
      data: { championImage: publicUrl },
    });

    return NextResponse.json({
      championImage: updated.championImage,
      message: `Imagen de la Semana ${week.weekNumber} actualizada`,
    });
  } catch (error) {
    console.error('Error updating champion image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}

// DELETE /api/weeks/[id]/champion-image
// Elimina la imagen del bucket y limpia el campo en la DB
export async function DELETE(_request, { params }) {
  try {
    const { id } = await params;
    const weekId = Number.parseInt(id);

    const week = await prisma.week.findUnique({ where: { id: weekId } });
    if (!week) {
      return NextResponse.json({ error: 'Semana no encontrada' }, { status: 404 });
    }

    if (week.championImage) {
      const filename = week.championImage.split('/').pop();
      await supabaseAdmin.storage.from(CHAMPION_IMAGES_BUCKET).remove([filename]);
    }

    await prisma.week.update({
      where: { id: weekId },
      data: { championImage: null },
    });

    return NextResponse.json({ message: 'Imagen eliminada' });
  } catch (error) {
    console.error('Error deleting champion image:', error);
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
  }
}
