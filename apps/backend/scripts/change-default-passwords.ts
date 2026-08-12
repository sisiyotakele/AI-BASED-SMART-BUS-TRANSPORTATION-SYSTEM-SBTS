/**
 * Script to change default test user passwords in production
 * Run this AFTER initial deployment to secure test accounts
 * 
 * Usage: tsx scripts/change-default-passwords.ts
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import * as readline from 'readline';

const prisma = new PrismaClient();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => rl.question(query, resolve));
};

const TEST_USER_EMAILS = [
    'superadmin@sbts.com',
    'admin@sbts.com',
    'manager@sbts.com',
    'driver@sbts.com',
    'passenger@sbts.com',
];

async function changeUserPassword(email: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
        where: { email },
        data: { passwordHash: hashedPassword },
    });

    console.log(`✅ Password changed for: ${email}`);
}

async function main() {
    console.log('🔐 Change Default Test User Passwords\n');
    console.log('⚠️  WARNING: This will change passwords for all test users!\n');

    const confirm = await question('Continue? (yes/no): ');

    if (confirm.toLowerCase() !== 'yes') {
        console.log('❌ Aborted');
        rl.close();
        process.exit(0);
    }

    console.log('\n📝 Enter new passwords for each user:');
    console.log('(Password must be at least 8 characters)\n');

    for (const email of TEST_USER_EMAILS) {
        let newPassword = '';
        let confirmPassword = '';

        do {
            newPassword = await question(`New password for ${email}: `);

            if (newPassword.length < 8) {
                console.log('❌ Password must be at least 8 characters!');
                continue;
            }

            confirmPassword = await question('Confirm password: ');

            if (newPassword !== confirmPassword) {
                console.log('❌ Passwords do not match! Try again.\n');
            }
        } while (newPassword !== confirmPassword || newPassword.length < 8);

        await changeUserPassword(email, newPassword);
        console.log('');
    }

    console.log('✅ All passwords changed successfully!');
    console.log('\n📝 IMPORTANT: Save these passwords securely!');
    console.log('Consider using a password manager or secure notes.\n');

    rl.close();
}

main()
    .catch((error) => {
        console.error('❌ Error changing passwords:', error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
