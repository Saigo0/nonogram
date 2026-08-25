import { NextResponse } from 'next/server';
import { PuzzleRepository } from '../../repository/puzzleRepository';
import { ResultRepository } from '../../repository/resultRepository';
import { Result } from '../../model/result';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sizeParam = searchParams.get('size') || '5';
    const size = parseInt(sizeParam, 10);

    const puzzleRepo = new PuzzleRepository();
    const puzzle = await puzzleRepo.findRandom(size);

    if (!puzzle) {
      return NextResponse.json(
        { error: `Nenhum puzzle de tamanho ${size} encontrado.` },
        { status: 404 }
      );
    }

    return NextResponse.json(puzzle);
  } catch (error) {
    console.error("Erro ao buscar puzzle:", error);
    return NextResponse.json(
      { error: 'Erro interno no servidor.' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { puzzleId, player, durationSeconds, wrongActions, actionsPerMinute } = body;

    const resultRepo = new ResultRepository();
    
    const resultObj = new Result(player, durationSeconds, wrongActions, actionsPerMinute);
    
    const savedResult = await resultRepo.save(puzzleId, resultObj);

    return NextResponse.json(savedResult, { status: 201 });
  } catch (error) {
    console.error("Erro ao salvar resultado:", error);
    return NextResponse.json(
      { error: 'Erro ao salvar o resultado.' },
      { status: 500 }
    );
  }
}