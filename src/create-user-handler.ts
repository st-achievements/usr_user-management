import { Class } from 'type-fest';
import { Handler } from '@st-api/core';
import { StFirebaseApp } from '@st-api/firebase';
import { runWith } from 'firebase-functions/v1';

export function createUserHandler(
  type: 'onCreate' | 'onDelete',
  handlerClazz: Class<Handler>,
): Parameters<StFirebaseApp['addCustomEvent']>[1] {
  // prettier-ignore
  return ({ runInContext, options }) =>
    runWith({
      secrets: options.secrets,
      maxInstances: options.maxInstances,
      memory: options.memory,
      minInstances: options.minInstances,
      preserveExternalChanges: options.preserveExternalChanges,
      timeoutSeconds: options.timeoutSeconds,
      failurePolicy: false,
    })
      .region(options.region ?? 'southamerica-east1')
      .auth.user()[type](async (user, context) => {
        await runInContext({
          state: {
            executionId: context.eventId || undefined,
          },
          eventData: {
            user,
            context,
          },
          eventTimestamp: context.timestamp,
          run: async ({ injector }) => {
            const handler = await injector.resolve(handlerClazz);
            await handler.handle(user, context);
          },
        });
      });
}
