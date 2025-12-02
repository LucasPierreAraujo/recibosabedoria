// scripts/createMasterUser.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const username = 'SabedoriaDeSalomao';
  const password = 'Sabedoria2025@';
  
  // Gera hash da senha
  const hashedPassword = await bcrypt.hash(password, 12);
  
  // Cria ou atualiza o usuário
  const user = await prisma.user.upsert({
    where: { username },
    update: { password: hashedPassword },
    create: {
      username,
      password: hashedPassword
    }
  });
  
  console.log('✅ Usuário master criado com sucesso!');
  console.log('Username:', username);
  console.log('Password:', password);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });