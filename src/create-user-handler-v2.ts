import { Class } from 'type-fest';
import { Handler } from '@st-api/core';
import { StFirebaseApp } from '@st-api/firebase';
import {
  beforeUserCreated,
  beforeUserSignedIn,
} from 'firebase-functions/identity';

const CreateUserHandlerV2TypeHandlers = {
  beforeUserCreated,
  beforeUserSignedIn,
} as const;

export function createUserHandlerV2(
  type: keyof typeof CreateUserHandlerV2TypeHandlers,
  handlerClazz: Class<Handler>,
): Parameters<StFirebaseApp['addCustomEvent']>[1] {
  return ({ runInContext, options }) =>
    CreateUserHandlerV2TypeHandlers[type](options, async (event) => {
      await runInContext({
        state: {
          executionId: event.eventId || undefined,
        },
        eventData: {
          user: event.data,
        },
        eventTimestamp: event.timestamp,
        run: async ({ injector }) => {
          const handler = await injector.resolve(handlerClazz);
          await handler.handle(event);
        },
      });
    });
}
