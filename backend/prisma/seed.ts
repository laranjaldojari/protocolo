import { PrismaClient, Role } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const departments = [
    { name: 'Gabinete do Prefeito', acronym: 'GABIN' },
    { name: 'Secretaria Municipal de Administração', acronym: 'SEMAD' },
    { name: 'Secretaria Municipal de Educação', acronym: 'SEMED' },
    { name: 'Secretaria Municipal de Saúde', acronym: 'SEMUS' },
    { name: 'Secretaria Municipal de Obras e Infraestrutura', acronym: 'SEMOB' },
    { name: 'Secretaria Municipal de Finanças e Tributos', acronym: 'SEFIN' },
    { name: 'Secretaria Municipal de Assistência Social', acronym: 'SEMAS' },
    { name: 'Secretaria Municipal de Meio Ambiente', acronym: 'SEMMA' },
    { name: 'Procuradoria Geral do Município', acronym: 'PGM' },
    { name: 'Protocolo Geral', acronym: 'PROTG' },
  ];
  for (const d of departments) {
    await prisma.department.upsert({ where: { acronym: d.acronym }, update: {}, create: d });
  }

  const subjects = [
    'Requerimento de Alvará de Funcionamento',
    'Requerimento de Alvará de Construção',
    'Certidão Negativa de Débitos',
    'Isenção / Revisão de IPTU',
    'Licença Ambiental',
    'Requerimento de Férias (Servidor)',
    'Licença Médica (Servidor)',
    'Progressão Funcional',
    'Denúncia / Reclamação',
    'Solicitação de Serviços Urbanos',
    'Ofício Externo',
    'Outros',
  ];
  for (const name of subjects) {
    await prisma.subject.upsert({ where: { name }, update: {}, create: { name } });
  }

  const protg = await prisma.department.findUniqueOrThrow({ where: { acronym: 'PROTG' } });
  const semad = await prisma.department.findUniqueOrThrow({ where: { acronym: 'SEMAD' } });

  await prisma.user.upsert({
    where: { email: 'admin@laranjaldojari.cloud' },
    update: {},
    create: {
      name: 'Administrador do Sistema',
      email: 'admin@laranjaldojari.cloud',
      passwordHash: await argon2.hash('Admin@123'),
      role: Role.ADMIN,
      departmentId: semad.id,
    },
  });

  await prisma.user.upsert({
    where: { email: 'atendente@laranjaldojari.cloud' },
    update: {},
    create: {
      name: 'Atendente do Protocolo Geral',
      email: 'atendente@laranjaldojari.cloud',
      passwordHash: await argon2.hash('Atende@123'),
      role: Role.ATENDENTE,
      departmentId: protg.id,
    },
  });

  console.log('Seed concluído.');
}

main().finally(() => prisma.$disconnect());
