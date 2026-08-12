import * as fs from 'fs';
import * as path from 'path';

interface CheckResult {
    name: string;
    status: 'pass' | 'fail' | 'warning';
    message: string;
    fix?: string;
}

const results: CheckResult[] = [];

function checkEnvFile(): CheckResult {
    const envPath = path.join(__dirname, '../.env.production');

    if (!fs.existsSync(envPath)) {
        return {
            name: 'Environment File',
            status: 'fail',
            message: '.env.production file not found',
            fix: 'Copy .env.production.example to .env.production',
        };
    }

    return {
        name: 'Environment File',
        status: 'pass',
        message: '.env.production exists',
    };
}

function checkEnvVariable(name: string, pattern?: RegExp): CheckResult {
    const value = process.env[name];

    if (!value) {
        return {
            name: `Env: ${name}`,
            status: 'fail',
            message: `${name} is not set`,
            fix: `Set ${name} in .env.production`,
        };
    }

    if (pattern && !pattern.test(value)) {
        return {
            name: `Env: ${name}`,
            status: 'warning',
            message: `${name} format may be incorrect`,
            fix: `Verify ${name} format in .env.production`,
        };
    }

    return {
        name: `Env: ${name}`,
        status: 'pass',
        message: `${name} is set`,
    };
}

function checkDatabaseURL(): CheckResult {
    const dbUrl = process.env.DATABASE_URL;

    if (!dbUrl) {
        return {
            name: 'Database URL',
            status: 'fail',
            message: 'DATABASE_URL is not set',
            fix: 'Set DATABASE_URL in .env.production',
        };
    }

    // Check if it's still localhost (development)
    if (dbUrl.includes('localhost') || dbUrl.includes('127.0.0.1')) {
        return {
            name: 'Database URL',
            status: 'warning',
            message: 'DATABASE_URL points to localhost (not production)',
            fix: 'Update DATABASE_URL to production database server',
        };
    }

    // Check if it has password
    if (!dbUrl.includes(':') || dbUrl.split(':').length < 3) {
        return {
            name: 'Database URL',
            status: 'warning',
            message: 'DATABASE_URL may be missing password',
            fix: 'Verify DATABASE_URL includes credentials',
        };
    }

    return {
        name: 'Database URL',
        status: 'pass',
        message: 'DATABASE_URL configured for production',
    };
}

function checkJWTSecrets(): CheckResult {
    const jwtSecret = process.env.JWT_SECRET;
    const jwtRefreshSecret = process.env.JWT_REFRESH_SECRET;

    if (!jwtSecret || !jwtRefreshSecret) {
        return {
            name: 'JWT Secrets',
            status: 'fail',
            message: 'JWT secrets not set',
            fix: 'Run: node scripts/generate-secrets.js',
        };
    }

    // Check if secrets are strong (at least 64 characters)
    if (jwtSecret.length < 64 || jwtRefreshSecret.length < 64) {
        return {
            name: 'JWT Secrets',
            status: 'warning',
            message: 'JWT secrets are too short (should be 64+ characters)',
            fix: 'Run: node scripts/generate-secrets.js',
        };
    }

    // Check if they're the same (security issue)
    if (jwtSecret === jwtRefreshSecret) {
        return {
            name: 'JWT Secrets',
            status: 'fail',
            message: 'JWT_SECRET and JWT_REFRESH_SECRET must be different',
            fix: 'Generate different secrets for each',
        };
    }

    return {
        name: 'JWT Secrets',
        status: 'pass',
        message: 'JWT secrets are strong and unique',
    };
}

function checkNodeEnv(): CheckResult {
    const nodeEnv = process.env.NODE_ENV;

    if (nodeEnv !== 'production') {
        return {
            name: 'Node Environment',
            status: 'warning',
            message: `NODE_ENV is '${nodeEnv}', should be 'production'`,
            fix: 'Set NODE_ENV=production in .env.production',
        };
    }

    return {
        name: 'Node Environment',
        status: 'pass',
        message: 'NODE_ENV is production',
    };
}

function checkCORS(): CheckResult {
    const corsOrigin = process.env.CORS_ORIGIN;

    if (!corsOrigin) {
        return {
            name: 'CORS Origin',
            status: 'fail',
            message: 'CORS_ORIGIN is not set',
            fix: 'Set CORS_ORIGIN to your frontend domain',
        };
    }

    // Check if it's still localhost
    if (corsOrigin.includes('localhost') || corsOrigin.includes('127.0.0.1')) {
        return {
            name: 'CORS Origin',
            status: 'warning',
            message: 'CORS_ORIGIN points to localhost (development)',
            fix: 'Update CORS_ORIGIN to production frontend URL',
        };
    }

    return {
        name: 'CORS Origin',
        status: 'pass',
        message: 'CORS_ORIGIN configured',
    };
}

function checkHTTPS(): CheckResult {
    const enableHttps = process.env.ENABLE_HTTPS;
    const secureCookies = process.env.SECURE_COOKIES;

    if (enableHttps !== 'true') {
        return {
            name: 'HTTPS Configuration',
            status: 'warning',
            message: 'HTTPS is disabled',
            fix: 'Set ENABLE_HTTPS=true when you have SSL certificate',
        };
    }

    if (secureCookies !== 'true') {
        return {
            name: 'HTTPS Configuration',
            status: 'warning',
            message: 'Secure cookies disabled',
            fix: 'Set SECURE_COOKIES=true for HTTPS',
        };
    }

    return {
        name: 'HTTPS Configuration',
        status: 'pass',
        message: 'HTTPS and secure cookies enabled',
    };
}

function checkBuildFiles(): CheckResult {
    const distPath = path.join(__dirname, '../dist');

    if (!fs.existsSync(distPath)) {
        return {
            name: 'Build Files',
            status: 'fail',
            message: 'dist/ folder not found',
            fix: 'Run: npm run build',
        };
    }

    const serverFile = path.join(distPath, 'server.js');
    if (!fs.existsSync(serverFile)) {
        return {
            name: 'Build Files',
            status: 'fail',
            message: 'dist/server.js not found',
            fix: 'Run: npm run build',
        };
    }

    return {
        name: 'Build Files',
        status: 'pass',
        message: 'Production build exists',
    };
}

function checkPrismaClient(): CheckResult {
    const prismaPath = path.join(__dirname, '../../../node_modules/.prisma/client');

    if (!fs.existsSync(prismaPath)) {
        return {
            name: 'Prisma Client',
            status: 'fail',
            message: 'Prisma Client not generated',
            fix: 'Run: npx prisma generate',
        };
    }

    return {
        name: 'Prisma Client',
        status: 'pass',
        message: 'Prisma Client generated',
    };
}

function printResults(results: CheckResult[]) {
    console.log('\n🔍 Production Deployment Checklist\n');
    console.log('═'.repeat(70));

    const passCount = results.filter((r) => r.status === 'pass').length;
    const failCount = results.filter((r) => r.status === 'fail').length;
    const warnCount = results.filter((r) => r.status === 'warning').length;

    results.forEach((result) => {
        const icon = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⚠️';
        console.log(`${icon} ${result.name.padEnd(30)} ${result.message}`);

        if (result.fix) {
            console.log(`   💡 Fix: ${result.fix}`);
        }
    });

    console.log('═'.repeat(70));
    console.log(`\n📊 Summary: ${passCount} passed, ${warnCount} warnings, ${failCount} failed\n`);

    if (failCount === 0 && warnCount === 0) {
        console.log('🎉 All checks passed! Ready for production deployment.\n');
        return true;
    } else if (failCount === 0) {
        console.log('⚠️  Some warnings detected. Review before deploying.\n');
        return true;
    } else {
        console.log('❌ Critical issues found. Fix them before deploying.\n');
        return false;
    }
}

function main() {
    // Load environment
    const envPath = path.join(__dirname, '../.env.production');
    if (fs.existsSync(envPath)) {
        require('dotenv').config({ path: envPath });
    }

    // Run checks
    results.push(checkEnvFile());
    results.push(checkNodeEnv());
    results.push(checkDatabaseURL());
    results.push(checkJWTSecrets());
    results.push(checkEnvVariable('PORT'));
    results.push(checkEnvVariable('AI_SERVICE_URL', /^https?:\/\/.+/));
    results.push(checkCORS());
    results.push(checkHTTPS());
    results.push(checkBuildFiles());
    results.push(checkPrismaClient());

    // Print results
    const allGood = printResults(results);

    // Exit with appropriate code
    process.exit(allGood ? 0 : 1);
}

main();
