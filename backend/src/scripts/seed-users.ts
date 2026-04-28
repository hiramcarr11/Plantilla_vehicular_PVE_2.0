import 'reflect-metadata';
import * as bcrypt from 'bcryptjs';
import { DataSource } from 'typeorm';
import dataSource from 'src/config/typeorm.config';
import { Role } from 'src/common/enums/role.enum';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { RegionEntity } from 'src/modules/catalog/entities/region.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

type SeedUserDefinition = {
  role: Role;
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
    role: Role.Enlace,
    firstName: 'Usuario',
    lastName: 'Enlace',
    grade: 'OFICIAL',
    phone: '5550000001',
    email: 'enlace.seed@example.local',
    useRegion: false,
    useDelegation: true,
  },
  {
    role: Role.Enlace,
    firstName: 'Enlace',
    lastName: 'Dos',
    grade: 'OFICIAL',
    phone: '5550000011',
    email: 'enlace2.seed@example.local',
    useRegion: false,
    useDelegation: true,
  },
  {
    role: Role.DirectorOperativo,
    firstName: 'Usuario',
    lastName: 'Director Operativo',
    grade: 'COMANDANTE',
    phone: '5550000002',
    email: 'director_operativo.seed@example.local',
    useRegion: true,
    useDelegation: false,
  },
  {
    role: Role.PlantillaVehicular,
    firstName: 'Usuario',
    lastName: 'Plantilla Vehicular',
    grade: 'ADMINISTRATIVO',
    phone: '5550000003',
    email: 'plantilla_vehicular.seed@example.local',
    useRegion: false,
    useDelegation: false,
  },
  {
    role: Role.DirectorGeneral,
    firstName: 'Usuario',
    lastName: 'Director General',
    grade: 'DIRECTOR',
    phone: '5550000004',
    email: 'director_general.seed@example.local',
    useRegion: false,
    useDelegation: false,
  },
  {
    role: Role.SuperAdmin,
    firstName: 'Super',
    lastName: 'Administrador',
    grade: 'SUPERADMIN',
    phone: '5550000005',
    email: 'superadmin.seed@example.local',
    useRegion: false,
    useDelegation: false,
  },
  {
    role: Role.Coordinacion,
    firstName: 'Usuario',
    lastName: 'Coordinacion',
    grade: 'COORDINADOR',
    phone: '5550000006',
    email: 'coordinacion.seed@example.local',
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
      throw new Error('No hay catalogo base. Ejecuta el bootstrap de catalogo antes del seed.');
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
