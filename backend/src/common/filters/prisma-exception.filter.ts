import { ArgumentsHost, Catch, ExceptionFilter, HttpStatus } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Response } from 'express';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter extends BaseExceptionFilter {
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const message = exception.message.replace(/\n/g, '');

    console.error('--- PRISMA ERROR DETECTED ---');
    console.error('Code:', exception.code);
    console.error('Message:', message);
    console.error('-----------------------------');

    switch (exception.code) {
      case 'P2002': {
        const status = HttpStatus.CONFLICT;
        response.status(status).json({
          statusCode: status,
          message: 'Conflict: Unique constraint failed',
        });
        break;
      }
      case 'P1000':
      case 'P1001': {
        const status = HttpStatus.SERVICE_UNAVAILABLE;
        response.status(status).json({
          statusCode: status,
          message: 'Database Connection Error. Please check backend logs for P100X code.',
        });
        break;
      }
      default:
        // default 500 error code
        super.catch(exception, host);
        break;
    }
  }
}
