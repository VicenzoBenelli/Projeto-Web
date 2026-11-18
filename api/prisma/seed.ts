import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  // Credencial pública de demonstração exigida pelo plano.
  const senhaHash = await bcrypt.hash('PetShop@2026!', 12);
  await prisma.$transaction(async tx => {
    await tx.usuario.upsert({
      where: { email: 'professor@petshop.com' },
      update: { nome: 'Professor', senhaHash },
      create: { nome: 'Professor', email: 'professor@petshop.com', senhaHash },
    });
    const tutorData = { nome: 'Tutor Demonstração', cpf: '12345678901', telefone: '11999999999' };
    const tutor = await tx.tutor.upsert({
      where: { cpf: tutorData.cpf }, update: tutorData, create: tutorData,
    });
    const servicoData = {
      nome: 'Banho', descricao: 'Banho de demonstração', precoCentavos: 5000, duracaoMinutos: 60,
    };
    const servico = await tx.servico.upsert({
      where: { nome: servicoData.nome }, update: servicoData, create: servicoData,
    });
    const animalData = { nome: 'Rex', especie: 'CACHORRO' as const, raca: null, tutorId: tutor.id };
    const existingAnimal = await tx.animal.findFirst({
      where: { nome: animalData.nome, tutorId: tutor.id }, orderBy: { id: 'asc' },
    });
    const animal = existingAnimal
      ? await tx.animal.update({ where: { id: existingAnimal.id }, data: animalData })
      : await tx.animal.create({ data: animalData });
    const agendamentoData = {
      animalId: animal.id, servicoId: servico.id, dataHora: new Date('2026-12-01T13:00:00.000Z'),
      status: 'AGENDADO' as const, observacoes: 'Demonstração',
    };
    const existingAgendamento = await tx.agendamento.findFirst({
      where: {
        animalId: animal.id, servicoId: servico.id, dataHora: agendamentoData.dataHora,
      },
      orderBy: { id: 'asc' },
    });
    if (existingAgendamento) {
      await tx.agendamento.update({ where: { id: existingAgendamento.id }, data: agendamentoData });
    } else {
      await tx.agendamento.create({ data: agendamentoData });
    }
  });
  console.info('Seed concluído: usuário, tutor, animal, serviço e agendamento de demonstração.');
}

main().catch(() => {
  console.error('Falha no seed; confira a conexão e as migrations do banco.');
  process.exitCode = 1;
}).finally(async () => { await prisma.$disconnect(); });
