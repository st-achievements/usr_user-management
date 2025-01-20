import { z } from 'zod';

export const GetUserByExternalIdParamsDto = z.object({
  externalId: z.string().min(1).max(255),
});

export type GetUserByExternalIdParamsDto = z.output<typeof GetUserByExternalIdParamsDto>