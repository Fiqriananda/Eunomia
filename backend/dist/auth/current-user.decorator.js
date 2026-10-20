import { createParamDecorator } from '@nestjs/common';
export const CurrentUser = createParamDecorator((data, ctx) => {
    const request = ctx.switchToHttp().getRequest();
    if (!request.user)
        return null;
    return data ? request.user[data] : request.user;
});
//# sourceMappingURL=current-user.decorator.js.map