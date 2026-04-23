import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import dataSource from 'src/config/typeorm.config';
import { Role } from 'src/common/enums/role.enum';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RegionEntity } from 'src/modules/catalog/entities/region.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

type SeedUserDefinition = {
  role: Exclude<Role, Role.SuperAdmin>;
  firstName: string;
  lastName: string;
  grade: string;
  phone: string;
  email: string;
  useRegion: boolean;
  useDelegation: boolean;
};

const SEED_USERS: SeedUserDefinition[] = [
  {
    role: Role.Capturist,
    firstName: 'Usuario',
    lastName: 'Capturista',
    grade: 'OFICIAL',
    phone: '5550000001',
    email: 'capturist.seed@example.local',
    useRegion: false,
    useDelegation: true,
  },
  {
    role: Role.RegionalManager,
    firstName: 'Usuario',
    lastName: 'Regional',
    grade: 'COMANDANTE',
    phone: '5550000002',
    email: 'regional_manager.seed@example.local',
    useRegion: true,
    useDelegation: false,
  },
  {
    role: Role.Admin,
    firstName: 'Usuario',
    lastName: 'Administrador',
    grade: 'ADMINISTRATIVO',
    phone: '5550000003',
    email: 'admin.seed@example.local',
    useRegion: false,
    useDelegation: false,
  },
  {
    role: Role.Director,
    firstName: 'Usuario',
    lastName: 'Director',
    grade: 'DIRECTOR',
    phone: '5550000004',
    email: 'director.seed@example.local',
    useRegion: false,
    useDelegation: false,
  },
];

function normalizeText(value: string) {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

async function run() {
  const password = process.env.SEED_USERS_PASSWORD?.trim();

  if (!password) {
    throw new Error('Falta SEED_USERS_PASSWORD. Define esa variable de entorno para ejecutar el seed.');
  }

  const source = dataSource as DataSource;
  await source.initialize();

  try {
    const userRepository = source.getRepository(UserEntity);
    const regionRepository = source.getRepository(RegionEntity);
    const delegationRepository = source.getRepository(DelegationEntity);

    const firstRegion = await regionRepository.findOne({
      where: {},
      order: {
        sortOrder: 'ASC',
      },
    });

    const firstDelegation = await delegationRepository.findOne({
      where: {},
      relations: {
        region: true,
      },
      order: {
        sortOrder: 'ASC',
      },
    });

    if (!firstRegion || !firstDelegation) {
      throw new Error('No hay catalogo base. Ejecuta migraciones y bootstrap de catalogo antes del seed.');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let createdCount = 0;
    let skippedCount = 0;

    for (const seedUser of SEED_USERS) {
      const existingUser = await userRepository.findOne({
        where: {
          email: seedUser.email,
        },
        withDeleted: true,
      });

      if (existingUser) {
        skippedCount += 1;
        continue;
      }

      await userRepository.save(
        userRepository.create({
          firstName: normalizeText(seedUser.firstName),
          lastName: normalizeText(seedUser.lastName),
          grade: normalizeText(seedUser.grade),
          phone: seedUser.phone,
          email: seedUser.email.toLowerCase(),
          passwordHash,
          role: seedUser.role,
          region: seedUser.useRegion ? firstRegion : null,
          delegation: seedUser.useDelegation ? firstDelegation : null,
        }),
      );

      createdCount += 1;
    }

    console.log(
      `Seed completado: ${createdCount} usuarios creados, ${skippedCount} usuarios ya existentes.`,
    );
  } finally {
    await source.destroy();
  }
}

void run().catch((error) => {
  console.error('Error al ejecutar seed de usuarios:', error);
  process.exit(1);
});
