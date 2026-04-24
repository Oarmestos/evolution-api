import { PrismaRepository } from '@api/repository/repository.service';
import { Logger } from '@config/logger.config';
import { BadRequestException, UnauthorizedException } from '@exceptions';
import { sign } from 'jsonwebtoken';

export class UserService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('UserService');

  public async login(data: any) {
    const { email, password } = data;

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.subscription?.plan?.name || 'FREE',
      },
      process.env.AUTHENTICATION_API_KEY || 'avri_secret_key',
      { expiresIn: '7d' },
    );

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        plan: user.subscription?.plan?.name || 'FREE',
      },
      token,
    };
  }

  public async register(data: any) {
    const { email, password, name } = data;

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }

    const freePlan = await this.prisma.plan.findUnique({ where: { name: 'Gratis' } });

    const user = await this.prisma.user.create({
      data: {
        email,
        password, // Nota: En producción usar bcrypt
        name,
        subscription: {
          create: {
            planId: freePlan?.id || '',
          },
        },
      },
    });

    return {
      message: 'Usuario registrado con éxito en el Plan Gratis',
      userId: user.id,
    };
  }
}
