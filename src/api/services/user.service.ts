import { PrismaRepository } from '@api/repository/repository.service';
import { Auth, configService } from '@config/env.config';
import { Logger } from '@config/logger.config';
import { BadRequestException, UnauthorizedException } from '@exceptions';
import { pbkdf2 as pbkdf2Callback, randomBytes, timingSafeEqual } from 'crypto';
import { sign } from 'jsonwebtoken';
import { promisify } from 'util';

const pbkdf2 = promisify(pbkdf2Callback);
const PASSWORD_HASH_ALGORITHM = 'pbkdf2';
const PASSWORD_HASH_DIGEST = 'sha512';
const PASSWORD_HASH_ITERATIONS = 120000;
const PASSWORD_HASH_KEY_LENGTH = 64;
const MIN_PASSWORD_LENGTH = 8;

function isPasswordHash(value: string): boolean {
  return value?.startsWith(`${PASSWORD_HASH_ALGORITHM}$`);
}

function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);

  if (bufA.length !== bufB.length) {
    return false;
  }

  return timingSafeEqual(bufA, bufB);
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const derivedKey = await pbkdf2(
    password,
    salt,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_KEY_LENGTH,
    PASSWORD_HASH_DIGEST,
  );

  return [
    PASSWORD_HASH_ALGORITHM,
    PASSWORD_HASH_ITERATIONS,
    PASSWORD_HASH_DIGEST,
    salt,
    derivedKey.toString('hex'),
  ].join('$');
}

async function verifyPassword(password: string, storedPassword: string): Promise<boolean> {
  if (!isPasswordHash(storedPassword)) {
    return safeCompare(password, storedPassword);
  }

  const [, iterations, digest, salt, hash] = storedPassword.split('$');
  if (!iterations || !digest || !salt || !hash) {
    return false;
  }

  const derivedKey = await pbkdf2(password, salt, Number(iterations), Buffer.from(hash, 'hex').length, digest);

  return safeCompare(derivedKey.toString('hex'), hash);
}

export class UserService {
  constructor(private readonly prisma: PrismaRepository) {}
  private readonly logger = new Logger('UserService');

  public async login(data: any) {
    const email = data?.email?.trim().toLowerCase();
    const password = data?.password;

    if (!email || !password) {
      throw new BadRequestException('Email y password son requeridos');
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { subscription: { include: { plan: true } } },
    });

    if (!user || !(await verifyPassword(password, user.password))) {
      throw new UnauthorizedException('Credenciales invalidas');
    }

    if (!isPasswordHash(user.password)) {
      try {
        await this.prisma.user.update({
          where: { id: user.id },
          data: { password: await hashPassword(password) },
        });
      } catch (error) {
        this.logger.warn(`Failed to migrate user password hash: ${error?.message || error}`);
      }
    }

    const token = sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        plan: user.subscription?.plan?.name || 'FREE',
      },
      configService.get<Auth>('AUTHENTICATION').API_KEY.KEY,
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
    const email = data?.email?.trim().toLowerCase();
    const password = data?.password;
    const name = data?.name;

    if (!email || !password) {
      throw new BadRequestException('Email y password son requeridos');
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(`Password debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres`);
    }

    const exists = await this.prisma.user.findUnique({ where: { email } });
    if (exists) {
      throw new BadRequestException('El usuario ya existe');
    }

    const freePlan = await this.prisma.plan.findUnique({ where: { name: 'Gratis' } });

    const user = await this.prisma.user.create({
      data: {
        email,
        password: await hashPassword(password),
        name,
        subscription: {
          create: {
            planId: freePlan?.id || '',
          },
        },
      },
    });

    return {
      message: 'Usuario registrado con exito en el Plan Gratis',
      userId: user.id,
    };
  }
}
