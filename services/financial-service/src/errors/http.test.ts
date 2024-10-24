import { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ZodError } from 'zod';
import {
    DatabaseError,
    QueryError,
    ServiceApiError,
    TransactionError,
    errorResponse,
    handleError,
    handleZodError
} from './http';

describe('Error Handling System', () => {
    let mockContext: Partial<Context>;
    const mockLogger = {
        error: vi.fn(),
        info: vi.fn(),
        warn: vi.fn(),
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockContext = {
            json: vi.fn().mockReturnValue(new Response()),
            get: vi.fn((key: string) => {
                if (key === 'requestId') return 'test-request-id';
                if (key === 'ctx') return { logger: mockLogger };
                return undefined;
            }),
        };
    });

    describe('ServiceApiError', () => {
        it('should create error with correct status code for each error code', () => {
            const testCases = [
                { code: 'BAD_REQUEST', expectedStatus: 400 },
                { code: 'FORBIDDEN', expectedStatus: 403 },
                { code: 'NOT_FOUND', expectedStatus: 404 },
                { code: 'METHOD_NOT_ALLOWED', expectedStatus: 405 },
                { code: 'NOT_UNIQUE', expectedStatus: 409 },
                { code: 'PRECONDITION_FAILED', expectedStatus: 412 },
                { code: 'RATE_LIMITED', expectedStatus: 429 },
                { code: 'INTERNAL_SERVER_ERROR', expectedStatus: 500 },
            ] as const;

            testCases.forEach(({ code, expectedStatus }) => {
                const error = new ServiceApiError({ code, message: 'Test message' });
                expect(error.status).toBe(expectedStatus);
                expect(error.code).toBe(code);
                expect(error.message).toBe('Test message');
            });
        });
    });

    describe('Specialized Error Classes', () => {
        it('should create DatabaseError with correct properties', () => {
            const error = new DatabaseError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Database connection failed'
            });
            expect(error.code).toBe('INTERNAL_SERVER_ERROR');
            expect(error.message).toBe('Database connection failed');
            expect(error instanceof ServiceApiError).toBe(true);
        });

        it('should create QueryError with correct properties', () => {
            const error = new QueryError({
                code: 'BAD_REQUEST',
                message: 'Invalid query parameter'
            });
            expect(error.code).toBe('BAD_REQUEST');
            expect(error.message).toBe('Invalid query parameter');
            expect(error instanceof ServiceApiError).toBe(true);
        });

        it('should create TransactionError with correct properties', () => {
            const error = new TransactionError({
                code: 'PRECONDITION_FAILED',
                message: 'Transaction failed'
            });
            expect(error.code).toBe('PRECONDITION_FAILED');
            expect(error.message).toBe('Transaction failed');
            expect(error instanceof ServiceApiError).toBe(true);
        });
    });

    describe('handleError', () => {
        it('should handle ServiceApiError', () => {
            const error = new ServiceApiError({
                code: 'BAD_REQUEST',
                message: 'Invalid input'
            });

            handleError(error, mockContext as Context);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: {
                    code: 'BAD_REQUEST',
                    docs: 'https://engineering-docs.solomon-ai.app/errors/code/BAD_REQUEST',
                    message: 'Invalid input',
                    requestId: 'test-request-id'
                }
            }, { status: 400 });
        });

        it('should handle HTTPException', () => {
            const error = new HTTPException(404, { message: 'Not found' });

            handleError(error, mockContext as Context);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: {
                    code: 'NOT_FOUND',
                    docs: 'https://engineering-docs.solomon-ai.app/errors/code/NOT_FOUND',
                    message: 'Not found',
                    requestId: 'test-request-id'
                }
            }, { status: 404 });
        });

        it('should handle unknown errors', () => {
            const error = new Error('Unknown error');

            handleError(error, mockContext as Context);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'unhandled exception',
                expect.objectContaining({
                    message: 'Unknown error',
                    requestId: 'test-request-id'
                })
            );

            expect(mockContext.json).toHaveBeenCalledWith({
                error: {
                    code: 'INTERNAL_SERVER_ERROR',
                    docs: 'https://engineering-docs.solomon-ai.app/errors/code/INTERNAL_SERVER_ERROR',
                    message: 'Unknown error',
                    requestId: 'test-request-id'
                }
            }, { status: 500 });
        });

        it('should log 5XX errors appropriately', () => {
            const error = new ServiceApiError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Server error'
            });

            handleError(error, mockContext as Context);

            expect(mockLogger.error).toHaveBeenCalledWith(
                'returning 5XX',
                expect.objectContaining({
                    message: 'Server error',
                    code: 'INTERNAL_SERVER_ERROR',
                    status: 500
                })
            );
        });
    });

    describe('handleZodError', () => {
        it('should handle Zod validation errors', () => {
            const mockZodError = new ZodError([{
                code: 'invalid_type',
                expected: 'string',
                received: 'number',
                path: ['field'],
                message: 'Expected string, received number'
            }]);

            const result = {
                success: false as const,
                error: mockZodError
            };

            handleZodError(result, mockContext as Context);

            expect(mockContext.json).toHaveBeenCalledWith({
                error: {
                    code: 'BAD_REQUEST',
                    docs: 'https://engineering-docs.solomon-ai.app/errors',
                    message: expect.any(String),
                    requestId: 'test-request-id'
                }
            }, { status: 400 });
        });

        it('should not handle successful validations', () => {
            const result = {
                success: true as const,
                data: { field: 'value' }
            };

            const response = handleZodError(result, mockContext as Context);
            expect(response).toBeUndefined();
            expect(mockContext.json).not.toHaveBeenCalled();
        });
    });

    describe('errorResponse', () => {
        it('should generate correct error response', () => {
            errorResponse(
                mockContext as Context,
                'NOT_FOUND',
                'Resource not found'
            );

            expect(mockContext.json).toHaveBeenCalledWith({
                error: {
                    code: 'NOT_FOUND',
                    docs: 'https://engineering-docs.solomon-ai.app/errors/code/NOT_FOUND',
                    message: 'Resource not found',
                    requestId: 'test-request-id'
                }
            }, { status: 404 });
        });
    });
});