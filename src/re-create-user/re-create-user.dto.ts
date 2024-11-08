import { z } from 'zod';
import { ParamIntSchema } from '@st-api/core';
import { UserCreatedDto } from '../user-created.dto.js';

export const ReCreateUserParamsDto = z.object({
  userId: ParamIntSchema,
});

export type ReCreateUserParamsDto = z.output<typeof ReCreateUserParamsDto>;

export const ReCreateUserBodyDto = z.object({
  email: z
    .string()
    .email()
    .optional()
    .openapi({
      description:
        `Optional email to replace the current email, if not provided the current email will be used.  ` +
        `If it's not provided and the current email is undefined an error will be thrown`,
    }),
});

export type ReCreateUserBodyDto = z.output<typeof ReCreateUserBodyDto>;

export const ReCreateUserEventDto = UserCreatedDto.extend({
  reCreateDate: z.string().datetime(),
  email: z.string().email(),
}).omit({
  inactivatedAt: true,
});

export type ReCreateUserEventDto = z.input<typeof ReCreateUserEventDto>;
