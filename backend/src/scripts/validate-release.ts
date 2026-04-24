import 'reflect-metadata';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import dataSource from 'src/config/typeorm.config';
import { Role } from 'src/common/enums/role.enum';
import { UserEntity } from 'src/modules/users/entities/user.entity';
import { RegionEntity } from 'src/modules/catalog/entities/region.entity';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';

type CheckResult = {
  name: string;
  status: 'pass' | 'fail' | 'warn';
  message: string;
};

const checks: CheckResult[] = [];

function check(name: string, status: 'pass' | 'fail' | 'warn', message: string) {
  checks.push({ name, status, message });
}

async function run() {
  console.log('=== Operational Pre-Release Validation ===\n');

  const source = dataSource as DataSource;

  try {
    await source.initialize();
    check('Database connection', 'pass', 'Successfully connected to PostgreSQL');
  } catch (error) {
    check('Database connection', 'fail', `Cannot connect: ${error instanceof Error ? error.message : String(error)}`);
    printResults();
    process.exit(1);
  }

  try {
    const userCount = await source.getRepository(UserEntity).count();
    if (userCount === 0) {
      check('Users', 'warn', 'No users exist. Run seed:users or create superadmin via SUPERADMIN_PASSWORD');
    } else {
      check('Users', 'pass', `${userCount} users exist`);
    }

    const superadminCount = await source.getRepository(UserEntity).count({
      where: { role: Role.SuperAdmin },
    });
    if (superadminCount === 0) {
      check('Superadmin', 'warn', 'No superadmin user exists. Set SUPERADMIN_EMAIL and SUPERADMIN_PASSWORD');
    } else {
      check('Superadmin', 'pass', `${superadminCount} superadmin(s) exist`);
    }

    const regionCount = await source.getRepository(RegionEntity).count();
    if (regionCount === 0) {
      check('Regions catalog', 'fail', 'No regions exist. Run migrations first');
    } else {
      check('Regions catalog', 'pass', `${regionCount} regions exist`);
    }

    const delegationCount = await source.getRepository(DelegationEntity).count();
    if (delegationCount === 0) {
      check('Delegations catalog', 'fail', 'No delegations exist. Run migrations first');
    } else {
      check('Delegations catalog', 'pass', `${delegationCount} delegations exist`);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret || jwtSecret.length < 16) {
      check('JWT_SECRET', 'fail', 'Not configured or too short (minimum 16 characters required)');
    } else {
      check('JWT_SECRET', 'pass', `Configured (${jwtSecret.length} characters)`);
    }

    const frontendOrigins = process.env.FRONTEND_ORIGINS;
    if (!frontendOrigins) {
      check('FRONTEND_ORIGINS', 'warn', 'Not configured. Only localhost origins will work');
    } else {
      check('FRONTEND_ORIGINS', 'pass', `Configured: ${frontendOrigins}`);
    }

    const dbPassword = process.env.DATABASE_PASSWORD;
    if (!dbPassword || dbPassword === 'change_me') {
      check('DATABASE_PASSWORD', 'fail', 'Not configured or still using default');
    } else {
      check('DATABASE_PASSWORD', 'pass', 'Configured');
    }
  } catch (error) {
    check('Validation error', 'fail', error instanceof Error ? error.message : String(error));
  } finally {
    await source.destroy();
  }

  printResults();
}

function printResults() {
  console.log('');

  const passCount = checks.filter((c) => c.status === 'pass').length;
  const failCount = checks.filter((c) => c.status === 'fail').length;
  const warnCount = checks.filter((c) => c.status === 'warn').length;

  for (const check of checks) {
    const icon = check.status === 'pass' ? '✓' : check.status === 'fail' ? '✗' : '!';
    console.log(`  ${icon} ${check.name}: ${check.message}`);
  }

  console.log('');
  console.log(`Results: ${passCount} passed, ${failCount} failed, ${warnCount} warnings`);

  if (failCount > 0) {
    console.log('\nACTION REQUIRED: Fix failed checks before deploying.');
    process.exit(1);
  } else if (warnCount > 0) {
    console.log('\nWarnings: Review before production deploy.');
  } else {
    console.log('\nAll checks passed. Ready for deployment.');
  }
}

void run().catch((error) => {
  console.error('Validation script failed:', error);
  process.exit(1);
});
