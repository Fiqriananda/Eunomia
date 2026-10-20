import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(data: { email: string; password: string; name: string }) {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        password: hashedPassword,
        name: data.name,
        avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(data.name)}`,
      },
    });

    // Automatically create a default workspace and project for seamless onboarding
    const workspaceSlug = `${data.name.toLowerCase().replace(/[^a-z0-9]/g, '')}-workspace-${Math.floor(1000 + Math.random() * 9000)}`;
    const workspace = await this.prisma.workspace.create({
      data: {
        name: `${data.name}'s Workspace`,
        slug: workspaceSlug,
        members: {
          create: {
            userId: user.id,
            role: 'OWNER',
          },
        },
        projects: {
          create: {
            name: 'Eunomia Core',
            key: 'EUN',
            description: 'Core product engineering & features',
            color: '#6366f1',
          },
        },
      },
      include: {
        projects: true,
      },
    });

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      workspace,
      defaultProject: workspace.projects[0],
    };
  }

  async login(data: { email: string; password: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
      include: {
        workspaces: {
          include: {
            workspace: {
              include: {
                projects: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const isMatch = await bcrypt.compare(data.password, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const token = this.jwtService.sign({ sub: user.id, email: user.email });

    const firstWorkspace = user.workspaces[0]?.workspace;

    return {
      accessToken: token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
      },
      workspace: firstWorkspace,
      defaultProject: firstWorkspace?.projects[0] || null,
    };
  }

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        workspaces: {
          include: {
            workspace: {
              include: {
                projects: true,
                members: {
                  include: {
                    user: {
                      select: {
                        id: true,
                        name: true,
                        email: true,
                        avatarUrl: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: {
      name?: string;
      avatarUrl?: string;
      email?: string;
      currentPassword?: string;
      newPassword?: string;
    },
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updateData: any = {};

    if (data.name && data.name.trim()) {
      updateData.name = data.name.trim();
    }

    if (data.avatarUrl !== undefined) {
      updateData.avatarUrl = data.avatarUrl;
    }

    if (data.email && data.email.toLowerCase() !== user.email) {
      const existing = await this.prisma.user.findUnique({
        where: { email: data.email.toLowerCase() },
      });
      if (existing) {
        throw new ConflictException('Email already in use');
      }
      updateData.email = data.email.toLowerCase();
    }

    if (data.newPassword && data.newPassword.trim()) {
      if (!data.currentPassword) {
        throw new BadRequestException('Current password is required to change password');
      }
      const isMatch = await bcrypt.compare(data.currentPassword, user.password);
      if (!isMatch) {
        throw new BadRequestException('Current password does not match');
      }
      if (data.newPassword.trim().length < 6) {
        throw new BadRequestException('New password must be at least 6 characters');
      }
      updateData.password = await bcrypt.hash(data.newPassword.trim(), 10);
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
      },
    });

    return updatedUser;
  }
}
