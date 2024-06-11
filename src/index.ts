import { AchievementsCoreAdapter } from '@st-achievements/core';
import { DATABASE_CONNECTION_STRING } from '@st-achievements/database';
import { StFirebaseApp } from '@st-api/firebase';
import { runWith } from 'firebase-functions';

import { AppHandler } from './app.handler.js';
import { AppModule } from './app.module.js';

const app = StFirebaseApp.create(AppModule, {
  secrets: [DATABASE_CONNECTION_STRING],
  adapter: new AchievementsCoreAdapter(),
}).addCustomEvent('User creation', ({ runInContext, options }) =>
  runWith({
    secrets: options.secrets,
    maxInstances: options.maxInstances,
    memory: options.memory,
    minInstances: options.minInstances,
    preserveExternalChanges: options.preserveExternalChanges,
    timeoutSeconds: options.timeoutSeconds,
    failurePolicy: false,
  })
    .auth.user()
    .onCreate(async (user, context) => {
      await runInContext({
        state: {
          executionId: context.eventId || undefined,
        },
        eventData: {
          user,
          context,
        },
        eventTimestamp: context.timestamp,
        run: async (nestApp) => {
          const handler = nestApp.get(AppHandler);
          await handler.handle(user, context);
        },
      });
    }),
);

export const usr_user = {
  creator: {
    http: app.getHttpHandler(),
    events: app.getCloudEventHandlers(),
  },
};
