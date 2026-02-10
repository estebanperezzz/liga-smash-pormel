import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

// GET /api/characters - Obtener todos los personajes
// Query params: weekId (opcional) - para obtener personajes disponibles en una semana
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const weekId = searchParams.get('weekId');

    if (weekId) {
      // Obtener personajes ya seleccionados en esta semana
      const selectedCharacters = await prisma.weeklyCharacter.findMany({
        where: { weekId: parseInt(weekId) },
        include: { character: true, player: true },
      });

      // Obtener todos los personajes
      const allCharacters = await prisma.character.findMany({
        orderBy: { name: 'asc' },
      });

      // Marcar cuáles están disponibles
      const charactersWithAvailability = allCharacters.map((char) => {
        const selection = selectedCharacters.find(
          (sel) => sel.characterId === char.id
        );
        return {
          ...char,
          available: !selection,
          selectedBy: selection ? selection.player.name : null,
        };
      });

      return NextResponse.json(charactersWithAvailability);
    }

    // Si no hay weekId, devolver todos los personajes
    const characters = await prisma.character.findMany({
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(characters);
  } catch (error) {
    console.error('Error fetching characters:', error);
    return NextResponse.json(
      { error: 'Error al obtener personajes' },
      { status: 500 }
    );
  }
}
