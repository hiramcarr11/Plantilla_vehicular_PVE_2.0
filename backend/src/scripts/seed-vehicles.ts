import 'reflect-metadata';
import { DataSource } from 'typeorm';
import dataSource from 'src/config/typeorm.config';
import { DelegationEntity } from 'src/modules/catalog/entities/delegation.entity';
import { UserEntity } from 'src/modules/users/entities/user.entity';

const BRANDS = ['NISSAN', 'TOYOTA', 'CHEVROLET', 'FORD', 'VOLKSWAGEN', 'HONDA', 'KIA'];
const TYPES = ['NP300', 'HILUX', 'SILVERADO', 'RANGER', 'JETTA', 'CIVIC', 'RIO'];
const USE_TYPES = ['PATRULLA', 'PARTICULAR'];
const VEHICLE_CLASSES = ['SEDAN', 'PICK UP', 'MOTOCICLETA', 'GRUA', 'BICICLETA'];
const PHYSICAL_STATUSES = ['BUENO', 'REGULAR', 'MALO'];
const STATUSES = ['ACTIVO', 'INCATIVO', 'SINIESTRADO', 'PARA BAJA', 'TALLER'];
const ASSET_CLASSIFICATIONS = ['PATRIMONIAL', 'ARRENDAMIENTO'];
const FIRST_NAMES = ['JUAN', 'PEDRO', 'LUIS', 'MARIO', 'JORGE', 'ANDRES', 'FERNANDO', 'ROBERTO'];
const LAST_NAMES = ['PEREZ', 'LOPEZ', 'MARTINEZ', 'HERNANDEZ', 'RAMIREZ', 'GARCIA', 'SANCHEZ'];

function pickRandom<T>(items: T[]) {
  return items[Math.floor(Math.random() * items.length)];
}

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomPlate() {
  const letters = Array.from({ length: 3 }, () =>
    String.fromCharCode(randomBetween(65, 90)),
  ).join('');
  const numbers = String(randomBetween(0, 999)).padStart(3, '0');
  return `${letters}-${numbers}`;
}

function randomDigits(length: number) {
  return Array.from({ length }, () => randomBetween(0, 9)).join('');
}

function randomDateWithinLastYear() {
  const now = Date.now();
  const oneYearAgo = new Date();
  oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
  const timestamp = randomBetween(oneYearAgo.getTime(), now);
  return new Date(timestamp);
}

function randomCustodian() {
  return `${pickRandom(FIRST_NAMES)} ${pickRandom(LAST_NAMES)}`;
}

async function run() {
  const source = dataSource as DataSource;
  await source.initialize();

  try {
    const delegationRepository = source.getRepository(DelegationEntity);
    const userRepository = source.getRepository(UserEntity);

    const delegations = await delegationRepository.find({
      relations: {
        region: true,
      },
    });

    if (delegations.length === 0) {
      throw new Error('No hay delegaciones en la base de datos. Ejecuta el bootstrap de catálogo primero.');
    }

    const users = await userRepository.find({
      where: {
        isActive: true,
      },
    });

    if (users.length === 0) {
      throw new Error('No hay usuarios activos en la base de datos para asignar createdBy.');
    }

    const createdBy = users[0];

    for (let index = 0; index < 35; index += 1) {
      const delegation = pickRandom(delegations);
      const date = randomDateWithinLastYear();

      const brand = pickRandom(BRANDS);
      const type = pickRandom(TYPES);
      const vehicleClass = pickRandom(VEHICLE_CLASSES);
      const status = pickRandom(STATUSES);
      const physicalStatus = pickRandom(PHYSICAL_STATUSES);

      await source.query(
        `
          INSERT INTO "records" (
            "plates",
            "brand",
            "type",
            "useType",
            "vehicleClass",
            "model",
            "engineNumber",
            "serialNumber",
            "custodian",
            "patrolNumber",
            "physicalStatus",
            "status",
            "assetClassification",
            "observation",
            "delegationId",
            "createdById",
            "createdAt",
            "updatedAt"
          )
          VALUES (
            $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $17
          )
        `,
        [
          randomPlate(),
          brand,
          type,
          pickRandom(USE_TYPES),
          vehicleClass,
          String(randomBetween(2012, 2026)),
          `EN-${randomDigits(10)}`,
          `SN-${randomDigits(12)}`,
          randomCustodian(),
          `P-${String(randomBetween(1, 999)).padStart(3, '0')}`,
          physicalStatus,
          status,
          pickRandom(ASSET_CLASSIFICATIONS),
          `REGISTRO GENERADO AUTOMATICAMENTE ${index + 1}`,
          delegation.id,
          createdBy.id,
          date,
        ],
      );
    }

    console.log('Seed completado: se insertaron 35 registros vehiculares.');
  } finally {
    await source.destroy();
  }
}

void run().catch((error) => {
  console.error('Error al ejecutar seed de vehículos:', error);
  process.exit(1);
});
