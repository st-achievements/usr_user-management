import { AchievementsCoreAdapter } from '@st-achievements/core';
import { DATABASE_CONNECTION_STRING } from '@st-achievements/database';
import { apiStateRunInContext } from '@st-api/core';
import { StFirebaseApp } from '@st-api/firebase';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat.js';
import { runWith } from 'firebase-functions';

import { AppHandler } from './app.handler.js';
import { AppModule } from './app.module.js';

dayjs.extend(customParseFormat);

const app = StFirebaseApp.create(AppModule, {
  secrets: [DATABASE_CONNECTION_STRING],
  adapter: new AchievementsCoreAdapter(),
});

export const usr_creator = {
  http: app.getHttpHandler(),
  event: runWith({
    secrets: [DATABASE_CONNECTION_STRING],
    maxInstances: 2,
    memory: '256MB',
    minInstances: 0,
    preserveExternalChanges: true,
    timeoutSeconds: 30,
    failurePolicy: false,
  })
    .auth.user()
    .onCreate(async (user, context) => {
      const nestApp = await app.getAppContext();
      await apiStateRunInContext(
        async () => {
          const handler = nestApp.get(AppHandler);
          await handler.handle(user, context);
        },
        {
          executionId: context.eventId || undefined,
          metadata: {
            // TODO expose on firebase app
            // Or better yet, create a way to set up apiStateRunContext for any custom event
            // Maybe something like this: app.createCustomEvent((context: { getApp, options }) => runWith(...))
            // [APP_SYMBOL]: nestApp,
          },
        },
      );
    }),
};
