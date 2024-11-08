import { AchievementsCoreAdapter } from '@st-achievements/core';
import { StFirebaseApp } from '@st-api/firebase';

import { UserCreationHandler } from './user-creation.handler.js';
import { createUserHandler } from './create-user-handler.js';
import { UserDeletionHandler } from './user-deletion.handler.js';
import { ReCreateUserController } from './re-create-user/re-create-user.controller.js';

const app = StFirebaseApp.create({
  adapter: new AchievementsCoreAdapter({
    throttling: true,
    authentication: true,
  }),
  controllers: [ReCreateUserController],
  providers: [UserCreationHandler, UserDeletionHandler],
})
  .withHttpHandler()
  .addCustomEvent(
    'User creation',
    createUserHandler('onCreate', UserCreationHandler),
  )
  .addCustomEvent(
    'User deletion',
    createUserHandler('onDelete', UserDeletionHandler),
  );

export const usr_user = {
  management: {
    http: app.getHttpHandler(),
    events: app.getCloudEventHandlers(),
  },
};
