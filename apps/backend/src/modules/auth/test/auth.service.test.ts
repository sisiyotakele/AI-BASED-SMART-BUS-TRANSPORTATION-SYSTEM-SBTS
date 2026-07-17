import * as authService from '../auth.service';
import { prismaTest, resetDatabase } from '@/common/test-utils/test-db';
import bcrypt from 'bcryptjs';

describe('Auth Service', () => {
    beforeEach(async () => {
        await resetDatabase();
        // Create passenger role for each test
        await prismaTest.role.create({
            data: {
                roleName: 'PASSENGER',
                description: 'Passenger role',
            },
        });
    });

    describe('registerPassenger', () => {
        it('should hash password and create user with passenger role', async () => {
            const userData = {
                email: 'test@passenger.com',
                password: 'SecurePass123!',
                fullName: 'Test Passenger',
                phone: '+1234567890',
            };

            const result = await authService.registerPassenger(userData);

            expect(result).toBeDefined();
            expect(result.email).toBe(userData.email.toLowerCase());
            expect(result.fullName).toBe(userData.fullName);
            expect(result.phone).toBe(userData.phone);
            expect(result.passwordHash).toBeDefined();
            expect(result.passwordHash).not.toBe(userData.password);

            const isPasswordCorrect = await bcrypt.compare(userData.password, result.passwordHash);
            expect(isPasswordCorrect).toBe(true);

            expect(result.userRoles).toBeDefined();
            expect(result.userRoles.length).toBeGreaterThan(0);
            expect(result.userRoles[0].role.roleName).toBe('PASSENGER');
        });

        it('should reject duplicate email', async () => {
            const userData = {
                email: 'duplicate@test.com',
                password: 'SecurePass123!',
                fullName: 'Test User',
                phone: '+1234567891',
            };

            await authService.registerPassenger(userData);
            await expect(authService.registerPassenger(userData)).rejects.toThrow();
        });
    });

    describe('login', () => {
        beforeEach(async () => {
            await authService.registerPassenger({
                email: 'abebe@test.com',
                password: 'SecurePass123!',
                fullName: 'Abebe Test',
                phone: '+1234567892',
            });
        });

        it('should return tokens on valid credentials', async () => {
            const result = await authService.login('abebe@test.com', 'SecurePass123!');

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.user).toBeDefined();
            expect(result.user.email).toBe('abebe@test.com');
            expect(result.user.roles).toContain('PASSENGER');
        });

        it('should reject invalid password', async () => {
            await expect(authService.login('abebe@test.com', 'wrongpass'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should reject non-existent user', async () => {
            await expect(authService.login('nobody@test.com', 'pass'))
                .rejects.toThrow('Invalid credentials');
        });

        it('should write login_history on success and failure', async () => {
            const user = await prismaTest.user.findUnique({
                where: { email: 'abebe@test.com' },
            });

            // Successful login
            await authService.login('abebe@test.com', 'SecurePass123!', '127.0.0.1');

            const successHistory = await prismaTest.loginHistory.findFirst({
                where: { userId: user!.id, action: 'login_success' },
                orderBy: { createdAt: 'desc' },
            });
            expect(successHistory).toBeDefined();
            expect(successHistory?.ipAddress).toBe('127.0.0.1');

            // Failed login
            try {
                await authService.login('abebe@test.com', 'wrong', '127.0.0.1');
            } catch (e) {
                // Expected
            }

            const failureHistory = await prismaTest.loginHistory.findFirst({
                where: { userId: user!.id, action: 'login_failure' },
                orderBy: { createdAt: 'desc' },
            });
            expect(failureHistory).toBeDefined();
            expect(failureHistory?.ipAddress).toBe('127.0.0.1');
        });
    });

    describe('refreshTokens', () => {
        beforeEach(async () => {
            await authService.registerPassenger({
                email: 'refresh@test.com',
                password: 'SecurePass123!',
                fullName: 'Refresh Test',
                phone: '+1234567893',
            });
        });

        it('should issue new tokens from valid refresh token', async () => {
            const loginResult = await authService.login('refresh@test.com', 'SecurePass123!');
            const result = await authService.refreshTokens(loginResult.refreshToken);

            expect(result).toBeDefined();
            expect(result.accessToken).toBeDefined();
            expect(result.refreshToken).toBeDefined();
            expect(result.accessToken).not.toBe(loginResult.accessToken);
            expect(result.refreshToken).not.toBe(loginResult.refreshToken);
        });

        it('should reject invalid refresh token', async () => {
            await expect(authService.refreshTokens('invalid-token'))
                .rejects.toThrow('Invalid refresh token');
        });
    });
});
