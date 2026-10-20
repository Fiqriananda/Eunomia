var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { PrismaModule } from './prisma/prisma.module.js';
import { AuthModule } from './auth/auth.module.js';
import { WorkspacesModule } from './workspaces/workspaces.module.js';
import { ProjectsModule } from './projects/projects.module.js';
import { TasksModule } from './tasks/tasks.module.js';
import { UploadsModule } from './uploads/uploads.module.js';
import { InboxModule } from './inbox/inbox.module.js';
import { EmailModule } from './email/email.module.js';
import { MobileModule } from './mobile/mobile.module.js';
import { EventsModule } from './events/events.module.js';
import { CyclesModule } from './cycles/cycles.module.js';
let AppModule = class AppModule {
};
AppModule = __decorate([
    Module({
        imports: [
            ConfigModule.forRoot({ isGlobal: true }),
            ServeStaticModule.forRoot({
                rootPath: path.join(process.cwd(), 'uploads'),
                serveRoot: '/uploads',
                serveStaticOptions: {
                    index: false,
                },
            }),
            PrismaModule,
            AuthModule,
            WorkspacesModule,
            ProjectsModule,
            TasksModule,
            UploadsModule,
            InboxModule,
            EmailModule,
            MobileModule,
            EventsModule,
            CyclesModule,
        ],
    })
], AppModule);
export { AppModule };
//# sourceMappingURL=app.module.js.map