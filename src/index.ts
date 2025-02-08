import { AchievementsCoreAdapter } from '@st-achievements/core';
import { StFirebaseApp } from '@st-api/firebase';

import { UserCreationHandler } from './user-creation.handler.js';
import { createUserHandler } from './create-user-handler.js';
import { UserDeletionHandler } from './user-deletion.handler.js';
import { ReCreateUserController } from './re-create-user/re-create-user.controller.js';
import { GetUserByExternalIdController } from './get-user-by-external-id/get-user-by-external-id.controller.js';
import { BeforeUserOperationHandler } from './before-user-operation-handler.service.js';
import { createUserHandlerV2 } from './create-user-handler-v2.js';

const app = StFirebaseApp.create({
  adapter: new AchievementsCoreAdapter({
    throttling: true,
    authentication: true,
  }),
  controllers: [ReCreateUserController, GetUserByExternalIdController],
  providers: [
    UserCreationHandler,
    UserDeletionHandler,
    BeforeUserOperationHandler,
  ],
})
  .withHttpHandler()
  .addCustomEvent(
    'User creation',
    createUserHandler('onCreate', UserCreationHandler),
  )
  .addCustomEvent(
    'User deletion',
    createUserHandler('onDelete', UserDeletionHandler),
  )
  .addCustomEvent(
    'Before user creation',
    createUserHandlerV2('beforeUserCreated', BeforeUserOperationHandler),
    { throwError: true },
  )
  .addCustomEvent(
    'Before user signed in',
    createUserHandlerV2('beforeUserSignedIn', BeforeUserOperationHandler),
    {
      throwError: true,
    },
  );

export const usr_user = {
  management: {
    http: app.getHttpHandler(),
    events: app.getCloudEventHandlers(),
  },
};
