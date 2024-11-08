import { Injectable } from '@stlmpp/di';
import { Handler } from '@st-api/core';
import { auth } from 'firebase-admin';
import { EventContext } from 'firebase-functions/v1';
import { Drizzle, usr } from '@st-achievements/database';
import { Logger } from '@st-api/firebase';
import { eq } from 'drizzle-orm';
import { EventarcService } from '@st-achievements/core';
import { UserInactivatedDto } from './used-inactivated.dto.js';
import { USER_INACTIVATED_EVENT } from './app.constants.js';

@Injectable()
export class UserDeletionHandler implements Handler {
  constructor(
    private readonly drizzle: Drizzle,
    private readonly eventarcService: EventarcService,
  ) {}

  private readonly logger = Logger.create(this);

  async handle(user: auth.UserRecord, context: EventContext): Promise<void> {
    Logger.setContext(`uid=${user.uid}`);
    this.logger.info('User deletion received', {
      user,
      context,
    });

    const userDatabase = await this.drizzle.query.usrUser.findFirst({
      where: eq(usr.user.externalId, user.uid),
      columns: {
        id: true,
        inactivatedAt: true,
        externalId: true,
        name: true,
      },
    });

    if (!userDatabase) {
      this.logger.info(`User with uid = ${user.uid} does not exists`);
      return;
    }

    if (userDatabase.inactivatedAt) {
      this.logger.info(
        `User already inactivated at ${userDatabase.inactivatedAt.toISOString()}`,
      );
      return;
    }

    const inactivatedAt = new Date();

    await this.drizzle
      .update(usr.user)
      .set({
        inactivatedAt,
      })
      .where(eq(usr.user.id, userDatabase.id));

    const event: UserInactivatedDto = {
      externalId: user.uid,
      userId: userDatabase.id,
      inactivatedAt: inactivatedAt.toISOString(),
      username: userDatabase.name,
    };

    this.logger.info(`event`, { event });

    await this.eventarcService.publish({
      body: event,
      type: USER_INACTIVATED_EVENT,
    });

    this.logger.info('Finished!');
  }
}
