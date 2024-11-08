import { z } from 'zod';

export const UserCreatedDto = z.object({
  userId: z.number(),
  externalId: z.string(),
  username: z.string(),
  inactivatedAt: z.string().datetime().optional(),
});

export type UserCreatedDto = z.output<typeof UserCreatedDto>;
