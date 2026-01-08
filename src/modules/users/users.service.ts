import bcrypt from 'bcryptjs';
import prismaService from '@core/database/prisma.service';
import redisService from '@core/redis/redis.service';
import {
  CreateUserDto,
  UpdateUserDto,
  UserListQuery,
  UpdateUserPasswordDto,
} from './dto/users.dto';
import { ConflictError, NotFoundError, BadRequestError } from '@common/utils/errors';
import { CACHE_KEYS, CACHE_TTL } from '@common/constants';
import eventEmitter, { AppEvents } from '@core/events/event-emitter.service';

class UsersService {
  // Get all users with pagination
  async getUsers(query: UserListQuery) {
    const page = query.page || 1;
    const pageSize = Math.min(query.pageSize || 20, 100);
    const skip = (page - 1) * pageSize;
    const sortBy = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder || 'desc';

    const where: any = {};

    if (query.search) {
      where.OR = [
        { email: { contains: query.search, mode: 'insensitive' } },
        { firstName: { contains: query.search, mode: 'insensitive' } },
        { lastName: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    if (query.roleId) {
      where.roleId = query.roleId;
    }

    if (query.isActive !== undefined) {
      where.isActive = query.isActive;
    }

    const [users, total] = await Promise.all([
      prismaService.user.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { [sortBy]: sortOrder },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          isActive: true,
          roleId: true,
          role: {
            select: {
              id: true,
              name: true,
              slug: true,
              permissions: true,
            },
          },
          createdAt: true,
          updatedAt: true,
        },
      }),
      prismaService.user.count({ where }),
    ]);

    return {
      data: users,
      meta: {
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  // Get user by ID
  async getUserById(id: string) {
    // Check cache first
    const cached = await redisService.getJSON(CACHE_KEYS.USER(id));
    if (cached) return cached;

    const user = await prismaService.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        isActive: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Cache result
    await redisService.setJSON(CACHE_KEYS.USER(id), user, CACHE_TTL.MEDIUM);

    return user;
  }

  // Create new user
  async createUser(data: CreateUserDto) {
    // Check if email already exists
    const existingUser = await prismaService.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Verify role exists
    const role = await prismaService.role.findUnique({
      where: { id: data.roleId },
    });

    if (!role) {
      throw new BadRequestError('Invalid role ID');
    }

    if (!role.isActive) {
      throw new BadRequestError('Cannot assign inactive role to user');
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
        roleId: data.roleId,
        phone: data.phone,
        avatar: data.avatar,
        isActive: true,
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        isActive: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Emit event
    eventEmitter.emitEvent(AppEvents.USER_CREATED, { userId: user.id });

    return user;
  }

  // Update user
  async updateUser(id: string, data: UpdateUserDto) {
    // Check if user exists
    const user = await prismaService.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if updating email to existing one
    if (data.email && data.email !== user.email) {
      const existingEmail = await prismaService.user.findUnique({
        where: { email: data.email },
      });

      if (existingEmail) {
        throw new ConflictError('User with this email already exists');
      }
    }

    // Verify role if changing
    if (data.roleId && data.roleId !== user.roleId) {
      const role = await prismaService.role.findUnique({
        where: { id: data.roleId },
      });

      if (!role) {
        throw new BadRequestError('Invalid role ID');
      }

      if (!role.isActive) {
        throw new BadRequestError('Cannot assign inactive role to user');
      }
    }

    // Update user
    const updated = await prismaService.user.update({
      where: { id },
      data: {
        ...(data.email && { email: data.email }),
        ...(data.firstName && { firstName: data.firstName }),
        ...(data.lastName && { lastName: data.lastName }),
        ...(data.roleId && { roleId: data.roleId }),
        ...(data.phone !== undefined && { phone: data.phone }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
        ...(data.isActive !== undefined && { isActive: data.isActive }),
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        phone: true,
        isActive: true,
        roleId: true,
        role: {
          select: {
            id: true,
            name: true,
            slug: true,
            permissions: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
    });

    // Clear cache
    await redisService.del(CACHE_KEYS.USER(id));
    await redisService.del(CACHE_KEYS.USER_PERMISSIONS(id));

    // Emit event
    eventEmitter.emitEvent(AppEvents.USER_UPDATED, { userId: id });

    return updated;
  }

  // Update user password (admin function)
  async updateUserPassword(id: string, data: UpdateUserPasswordDto) {
    // Check if user exists
    const user = await prismaService.user.findUnique({ where: { id } });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, 10);

    // Update password
    await prismaService.user.update({
      where: { id },
      data: { password: hashedPassword },
    });

    // Delete all refresh tokens to force re-login
    await prismaService.refreshToken.deleteMany({
      where: { userId: id },
    });
  }

  // Delete user
  async deleteUser(id: string) {
    // Check if user exists
    const user = await prismaService.user.findUnique({
      where: { id },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Prevent deleting admin users (optional - for safety)
    if (user.role.slug === 'admin') {
      // Check if there are other admin users
      const adminCount = await prismaService.user.count({
        where: { roleId: user.roleId, isActive: true },
      });

      if (adminCount <= 1) {
        throw new BadRequestError('Cannot delete the last active admin user');
      }
    }

    // Delete user (cascade will handle related records)
    await prismaService.user.delete({ where: { id } });

    // Clear cache
    await redisService.del(CACHE_KEYS.USER(id));
    await redisService.del(CACHE_KEYS.USER_PERMISSIONS(id));

    // Emit event
    eventEmitter.emitEvent(AppEvents.USER_DELETED, { userId: id });
  }

  // Get user statistics
  async getUserStats() {
    const [total, active, inactive, byRole] = await Promise.all([
      prismaService.user.count(),
      prismaService.user.count({ where: { isActive: true } }),
      prismaService.user.count({ where: { isActive: false } }),
      prismaService.user.groupBy({
        by: ['roleId'],
        _count: true,
      }),
    ]);

    // Get role names
    const roleIds = byRole.map((r: any) => r.roleId);
    const roles = await prismaService.role.findMany({
      where: { id: { in: roleIds } },
      select: { id: true, name: true, slug: true },
    });

    const byRoleWithNames = byRole.map((r: any) => {
      const role = roles.find((role: any) => role.id === r.roleId);
      return {
        roleId: r.roleId,
        roleName: role?.name || 'Unknown',
        roleSlug: role?.slug || 'unknown',
        count: r._count,
      };
    });

    return {
      total,
      active,
      inactive,
      byRole: byRoleWithNames,
    };
  }
}

export default new UsersService();
