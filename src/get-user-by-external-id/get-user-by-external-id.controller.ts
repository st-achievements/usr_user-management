import { Controller, Exceptions, Handler, ZParams, ZRes } from '@st-api/core';
import { USER_IS_INACTIVE, USER_NOT_FOUND } from '../exceptions.js';
import { UserCreatedDto } from '../user-created.dto.js';
import { Drizzle, usr } from '@st-achievements/database';
import { GetUserByExternalIdParamsDto } from './get-user-by-external-id.dto.js';
import { and, eq } from 'drizzle-orm';

@ZRes(UserCreatedDto)
@Exceptions([USER_NOT_FOUND])
@Controller({
  path: 'v1/users/external/:externalId',
})
export class GetUserByExternalIdController implements Handler {
  constructor(private readonly drizzle: Drizzle) {}

  async handle(
    @ZParams(GetUserByExternalIdParamsDto)
    { externalId }: GetUserByExternalIdParamsDto,
  ): Promise<UserCreatedDto> {
    const user = await this.drizzle.query.usrUser.findFirst({
      where: and(eq(usr.user.externalId, externalId)),
    });
    if (!user) {
      throw USER_NOT_FOUND();
    }
    if (user.inactivatedAt) {
      throw USER_IS_INACTIVE();
    }
    return {
      userId: user.id,
      externalId,
      username: user.name,
    };
  }
}
