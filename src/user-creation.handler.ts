import { EventarcService } from '@st-achievements/core';
import { Drizzle, usr } from '@st-achievements/database';
import { getCorrelationId, Handler } from '@st-api/core';
import { Logger } from '@st-api/firebase';
import { eq } from 'drizzle-orm';
import { auth } from 'firebase-admin';
import { EventContext } from 'firebase-functions/v1';

import { USER_CREATED_EVENT } from './app.constants.js';
import { UserCreatedDto } from './user-created.dto.js';
import { Injectable } from '@stlmpp/di';
import { UserMetadata } from './user-metadata.enum.js';

@Injectable()
export class UserCreationHandler implements Handler {
  constructor(
    private readonly drizzle: Drizzle,
    private readonly eventarcService: EventarcService,
  ) {}

  private readonly logger = Logger.create(this);

  private parseName(user: auth.UserRecord): string {
    const name = user.displayName || user.email?.split('@').at(0);
    return name?.slice(0, 255) || user.uid;
  }

  async handle(user: auth.UserRecord, context: EventContext): Promise<void> {
    Logger.setContext(`uid=${user.uid}`);
    this.logger.info('User received', {
      user,
      context,
    });
    const uidExists = await this.drizzle.query.usrUser.findFirst({
      where: eq(usr.user.externalId, user.uid),
      columns: {
        id: true,
      },
    });
    if (uidExists) {
      this.logger.info(
        `User already exists with uid = "${user.uid}", userId = ${uidExists.id}`,
      );
      return;
    }
    let name = this.parseName(user);
    this.logger.info(`Trying to create with name "${name}"`);
    const userExists = await this.drizzle.query.usrUser.findFirst({
      where: eq(usr.user.name, name),
      columns: {
        id: true,
      },
    });
    if (userExists) {
      this.logger.info(
        `Username = "${name}" already exists, will create with uid as name`,
      );
      name = user.uid;
    }
    const result = await this.drizzle
      .insert(usr.user)
      .values({
        name,
        externalId: user.uid,
        inactivatedAt: user.disabled ? new Date() : undefined,
        metadata: {
          correlationId: getCorrelationId(),
          [UserMetadata.DisplayName]: user.displayName || null,
          [UserMetadata.Email]: user.email || null,
          [UserMetadata.PhoneNumber]: user.phoneNumber || null,
        },
      })
      .returning();
    const newUser = result.at(0)!;
    this.logger.info(`newUser`, { newUser });
    const event: UserCreatedDto = {
      inactivatedAt: newUser.inactivatedAt?.toISOString(),
      externalId: user.uid,
      userId: newUser.id,
      username: newUser.name,
    };
    this.logger.info(`event`, { event });
    await this.eventarcService.publish({
      type: USER_CREATED_EVENT,
      body: event,
    });
    this.logger.info('Finished!');
  }
}
