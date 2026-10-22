import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';
async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    app.enableCors({
        origin: true,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    });
    app.useGlobalPipes(new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const swaggerConfig = new DocumentBuilder()
        .setTitle('Eunomia API & Mobile Endpoints')
        .setDescription('REST API documentation for the Eunomia project management platform. Includes dedicated consolidated Mobile endpoints (/mobile/*) designed for mobile apps (Flutter, React Native, iOS, Android), as well as core services for tasks, workspaces, projects, file uploads, and notifications.')
        .setVersion('1.0.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter your JWT authorization token (obtained via /auth/login or /auth/register)',
        in: 'header',
    }, 'JWT-auth')
        .addTag('Mobile', 'Endpoints engineered specifically for Mobile App (iOS / Android / Flutter / React Native)')
        .addTag('Auth', 'Authentication, user credentials and profile')
        .addTag('Workspaces', 'Workspace organization and team membership')
        .addTag('Projects', 'Project management and issue scoping')
        .addTag('Tasks', 'Task lifecycle, boards, relations, and comments')
        .addTag('Inbox', 'Notifications and activity alerts')
        .addTag('Uploads', 'Attachments and file uploads')
        .build();
    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Eunomia API & Mobile Documentation',
        swaggerOptions: {
            persistAuthorization: true,
            docExpansion: 'list',
            filter: true,
        },
    });
    const httpAdapter = app.getHttpAdapter();
    httpAdapter.get('/docs', (req, res) => {
        res.redirect('/api/docs');
    });
    httpAdapter.get('/swagger', (req, res) => {
        res.redirect('/api/docs');
    });
    const port = process.env.PORT || 4000;
    await app.listen(port);
    console.log(`🚀 Eunomia Backend running on http://localhost:${port}`);
    console.log(`📖 Swagger API Docs running on http://localhost:${port}/api/docs`);
}
await bootstrap();
//# sourceMappingURL=main.js.map