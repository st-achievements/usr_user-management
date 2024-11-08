import {
  Controller,
  Exceptions,
  Handler,
  ZBody,
  ZParams,
  ZRes,
} from '@st-api/core';
import { Drizzle, usr } from '@st-achievements/database';
import { FirebaseAdminAuth } from '@st-api/firebase';
import {
  ReCreateUserBodyDto,
  ReCreateUserEventDto,
  ReCreateUserParamsDto,
} from './re-create-user.dto.js';
import { eq } from 'drizzle-orm';
import { UserMetadata } from '../user-metadata.enum.js';
import { EventarcService } from '@st-achievements/core';
import { USER_RE_CREATED_EVENT } from '../app.constants.js';
import {
  EMAIL_IS_REQUIRED,
  USER_IS_NOT_INACTIVE,
  USER_NOT_FOUND,
} from '../exceptions.js';
import { StatusCodes } from 'http-status-codes';

// TODO add check for ADMIN

@Exceptions([USER_NOT_FOUND, USER_IS_NOT_INACTIVE, EMAIL_IS_REQUIRED])
@ZRes(ReCreateUserEventDto, StatusCodes.CREATED)
@Controller({
  path: 'v1/users/:userId/re-create',
  method: 'POST',
})
export class ReCreateUserController implements Handler {
  constructor(
    private readonly drizzle: Drizzle,
    private readonly firebaseAdminAuth: FirebaseAdminAuth,
    private readonly eventarcService: EventarcService,
  ) {}

  async handle(
    @ZParams(ReCreateUserParamsDto) { userId }: ReCreateUserParamsDto,
    @ZBody(ReCreateUserBodyDto) body: ReCreateUserBodyDto,
  ): Promise<ReCreateUserEventDto> {
    const user = await this.drizzle.query.usrUser.findFirst({
      columns: {
        inactivatedAt: true,
        id: true,
        metadata: true,
        externalId: true,
        name: true,
      },
      where: eq(usr.user.id, userId),
    });

    if (!user) {
      throw USER_NOT_FOUND();
    }

    if (!user.inactivatedAt) {
      throw USER_IS_NOT_INACTIVE();
    }

    const email = body.email ?? user.metadata[UserMetadata.Email];

    if (typeof email !== 'string') {
      throw EMAIL_IS_REQUIRED();
    }

    const externalUser = await this.firebaseAdminAuth.createUser({
      uid: user.externalId ?? undefined,
      email,
      disabled: false,
      displayName:
        user.metadata[UserMetadata.DisplayName]?.toString() ?? undefined,
      phoneNumber:
        user.metadata[UserMetadata.PhoneNumber]?.toString() ?? undefined,
    });

    await this.drizzle
      .update(usr.user)
      .set({
        inactivatedAt: null,
        externalId: externalUser.uid,
        metadata: { ...user.metadata, [UserMetadata.Email]: email },
      })
      .execute();

    const event: ReCreateUserEventDto = {
      userId: user.id,
      username: user.name,
      externalId: externalUser.uid,
      reCreateDate: new Date().toISOString(),
      email,
    };

    await this.eventarcService.publish({
      type: USER_RE_CREATED_EVENT,
      body: event,
    });

    return event;
  }
}
