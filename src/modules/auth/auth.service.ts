import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import envConfig from '@config/env.config';
import { LoginDto, RegisterDto, AuthResponse } from './dto/auth.dto';
import {
  UnauthorizedError,
  ConflictError,
  NotFoundError,
  BadRequestError,
} from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';

class AuthService {
  // Register new user
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if user already exists
    const existingUser = await prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Get default role (staff)
    const defaultRole = await prismaService.role.findUnique({
      where: { slug: 'staff' },
    });

    if (!defaultRole) {
      throw new BadRequestError('Default role not found');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prismaService.user.create({
      data: {
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
        roleId: defaultRole.id,
      },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    // Emit event
    eventEmitter.emitEvent(AppEvents.USER_CREATED, { userId: user.id });

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.roleId
    );

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // Login
  async login(data: LoginDto): Promise<AuthResponse> {
    // Find user
    const user = await prismaService.user.findUnique({
      where: { email: data.email },
      include: {
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new UnauthorizedError('Account is deactivated');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate tokens
    const { accessToken, refreshToken } = await this.generateTokens(
      user.id,
      user.email,
      user.roleId
    );

    // Save refresh token
    await this.saveRefreshToken(user.id, refreshToken);

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  async refreshToken(token: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(token, envConfig.get('JWT_REFRESH_SECRET')) as {
        userId: string;
        email: string;
        roleId: string;
        tokenId: string;
      };

      // Check if token exists in database
      const storedToken = await prismaService.refreshToken.findUnique({
        where: { token },
      });

      if (!storedToken) {
        throw new UnauthorizedError('Invalid refresh token');
      }

      // Check if token is expired
      if (storedToken.expiresAt < new Date()) {
        await prismaService.refreshToken.delete({ where: { id: storedToken.id } });
        throw new UnauthorizedError('Refresh token expired');
      }

      // Generate new tokens
      const { accessToken, refreshToken: newRefreshToken } = await this.generateTokens(
        decoded.userId,
        decoded.email,
        decoded.roleId
      );

      // Delete old refresh token
      await prismaService.refreshToken.delete({ where: { id: storedToken.id } });

      // Save new refresh token
      await this.saveRefreshToken(decoded.userId, newRefreshToken);

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      throw new UnauthorizedError('Invalid or expired refresh token');
    }
  }

  // Logout
  async logout(userId: string, accessToken: string): Promise<void> {
    // Delete all refresh tokens for user
    await prismaService.refreshToken.deleteMany({
      where: { userId },
    });

    // Blacklist access token
    const decoded = jwt.decode(accessToken) as { exp: number };
    const ttl = decoded.exp - Math.floor(Date.now() / 1000);

    if (ttl > 0) {
      await redisService.set(`blacklist:${accessToken}`, '1', ttl);
    }

    // Clear cached permissions
    await redisService.del(CACHE_KEYS.USER_PERMISSIONS(userId));
  }

  // Get current user
  async getCurrentUser(userId: string) {
    const user = await prismaService.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        isActive: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: true,
          },
        },
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    return user;
  }

  // Change password
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prismaService.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify old password
    const isPasswordValid = await bcrypt.compare(oldPassword, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid old password');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password
    await prismaService.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens
    await prismaService.refreshToken.deleteMany({
      where: { userId },
    });
  }

  // Helper: Generate tokens
  private async generateTokens(userId: string, email: string, roleId: string) {
    const tokenId = uuidv4();

    const accessToken = jwt.sign({ userId, email, roleId }, envConfig.get('JWT_SECRET'), {
      expiresIn: envConfig.get('JWT_EXPIRES_IN') as any,
    });

    const refreshToken = jwt.sign(
      { userId, email, roleId, tokenId },
      envConfig.get('JWT_REFRESH_SECRET'),
      { expiresIn: envConfig.get('JWT_REFRESH_EXPIRES_IN') as any }
    );

    return { accessToken, refreshToken };
  }

  // Helper: Save refresh token
  private async saveRefreshToken(userId: string, token: string) {
    const decoded = jwt.decode(token) as { exp: number };
    const expiresAt = new Date(decoded.exp * 1000);

    await prismaService.refreshToken.create({
      data: {
        token,
        userId,
        expiresAt,
      },
    });
  }
}

export default new AuthService();
