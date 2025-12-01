import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'data', 'membros.json');

// Garante que a pasta data existe
function ensureDataDir() {
  const dir = path.join(process.cwd(), 'data');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify([]));
  }
}

// GET - Listar todos os membros
export async function GET() {
  try {
    ensureDataDir();
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const membros = JSON.parse(data);
    return NextResponse.json(membros);
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao buscar membros' }, { status: 500 });
  }
}

// POST - Adicionar novo membro
export async function POST(request) {
  try {
    ensureDataDir();
    const novoMembro = await request.json();
    
    const data = fs.readFileSync(DB_PATH, 'utf8');
    const membros = JSON.parse(data);
    
    const membro = {
      id: Date.now().toString(),
      ...novoMembro,
      dataCadastro: new Date().toISOString()
    };
    
    membros.push(membro);
    fs.writeFileSync(DB_PATH, JSON.stringify(membros, null, 2));
    
    return NextResponse.json({ success: true, membro });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao adicionar membro' }, { status: 500 });
  }
}

// DELETE - Remover membro
export async function DELETE(request) {
  try {
    ensureDataDir();
    const { id } = await request.json();
    
    const data = fs.readFileSync(DB_PATH, 'utf8');
    let membros = JSON.parse(data);
    
    membros = membros.filter(m => m.id !== id);
    fs.writeFileSync(DB_PATH, JSON.stringify(membros, null, 2));
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao remover membro' }, { status: 500 });
  }
}

// PUT - Atualizar membro
export async function PUT(request) {
  try {
    ensureDataDir();
    const membroAtualizado = await request.json();
    
    const data = fs.readFileSync(DB_PATH, 'utf8');
    let membros = JSON.parse(data);
    
    const index = membros.findIndex(m => m.id === membroAtualizado.id);
    if (index !== -1) {
      membros[index] = { ...membros[index], ...membroAtualizado };
      fs.writeFileSync(DB_PATH, JSON.stringify(membros, null, 2));
      return NextResponse.json({ success: true, membro: membros[index] });
    }
    
    return NextResponse.json({ error: 'Membro não encontrado' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Erro ao atualizar membro' }, { status: 500 });
  }
}