import { exception } from '@st-api/core';
import { StatusCodes } from 'http-status-codes';

export const USER_NOT_FOUND = exception({
  errorCode: 'USR-RECREATE-0001',
  error: 'User not found',
  message: 'User not found',
  status: StatusCodes.NOT_FOUND,
});

export const USER_IS_NOT_INACTIVE = exception({
  errorCode: 'USR-RECREATE-0002',
  error: 'User is not inactivated',
  message: 'User is not inactivated',
  status: StatusCodes.BAD_REQUEST,
});

export const EMAIL_IS_REQUIRED = exception({
  errorCode: 'USR-RECREATE-0003',
  error: 'Email is required for user without email',
  message: 'Email is required for user without email',
  status: StatusCodes.BAD_REQUEST,
});
