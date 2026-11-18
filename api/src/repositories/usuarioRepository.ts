import type { Prisma } from '@prisma/client';
import { prisma } from '../lib/prisma';

const publicSelect = { id: true, nome: true, email: true } satisfies Prisma.UsuarioSelect;

export const usuarioRepository = {
  criar(data: Pick<Prisma.UsuarioCreateInput, 'nome' | 'email' | 'senhaHash'>) {
    return prisma.usuario.create({ data, select: publicSelect });
  },
  buscarParaLogin(email: string) {
    return prisma.usuario.findUnique({ where: { email } });
  },
};
