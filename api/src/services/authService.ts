import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { CadastroInput, LoginInput } from '../contracts';
import { getJwtSecret } from '../config';
import { AppError } from '../errors/AppError';
import { usuarioRepository } from '../repositories/usuarioRepository';

export const authService = {
  async cadastrar(input: CadastroInput) {
    const senhaHash = await bcrypt.hash(input.senha, 12);
    return usuarioRepository.criar({ nome: input.nome, email: input.email, senhaHash });
  },
  async login(input: LoginInput) {
    const usuario = await usuarioRepository.buscarParaLogin(input.email);
    if (!usuario || !(await bcrypt.compare(input.senha, usuario.senhaHash))) {
      throw new AppError(401, 'E-mail ou senha inválidos');
    }
    const token = jwt.sign({}, getJwtSecret(), {
      subject: String(usuario.id), expiresIn: '1h', algorithm: 'HS256', issuer: 'petshop-api',
    });
    return { token, usuario: { id: usuario.id, nome: usuario.nome, email: usuario.email } };
  },
};
