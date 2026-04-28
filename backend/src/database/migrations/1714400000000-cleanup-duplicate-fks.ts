import { MigrationInterface, QueryRunner } from 'typeorm';

export class CleanupDuplicateFKs1714400000000 implements MigrationInterface {
  name = 'CleanupDuplicateFKs1714400000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const duplicates = [
      'FK_2dc33f7f3c22e2e7badafca1d12',
      'FK_4928ef292e3fb48783034b82f7a',
      'FK_5d93fb1843f96fbdefea37dae86',
      'FK_79cfe56699b0d98daa8c0b74cc1',
      'FK_3a14895e951f699c636e428f797',
      'FK_5bb7f97934c3dfa9e033a61990b',
      'FK_e5663ce0c730b2de83445e2fd19',
      'FK_2db9cf2b3ca111742793f6c37ce',
      'FK_8ba8ff09a3de183a4e9d04a9f2c',
      'FK_a1b1047f264c3755821a6b1c911',
      'FK_62e00d0e0c1af6ddc791a735cae',
      'FK_2c69c851bdaed5b02825d6f6d50',
      'FK_0a73ef18b47dedcb9a27d49d7e7',
      'FK_1581acde2264db5bf6cbd047ba8',
      'FK_feccd835ad29c718a632a025e44',
      'FK_dad741fdcfccf62750814e74654',
      'FK_633589096e47a16157d5a46f323',
      'FK_be583da936658ab8febbca498e6',
      'FK_b7df0dd906ecc8a8df2b87de72b',
      'FK_2e7a40a8eecb6a9de7bf9064ba6',
      'FK_08dff63990dff9b2c400acc4b45',
    ];

    for (const constraintName of duplicates) {
      const exists = await queryRunner.query(
        `SELECT EXISTS(SELECT 1 FROM information_schema.table_constraints WHERE constraint_schema = 'public' AND constraint_name = $1 AND constraint_type = 'FOREIGN KEY')`,
        [constraintName],
      );
      if (exists[0].exists) {
        await queryRunner.query(
          `ALTER TABLE public.${this.getTableForConstraint(constraintName)} DROP CONSTRAINT IF EXISTS "${constraintName}"`,
        );
      }
    }
  }

  private getTableForConstraint(name: string): string {
    const map: Record<string, string> = {
      'FK_2dc33f7f3c22e2e7badafca1d12': 'audit_logs',
      'FK_4928ef292e3fb48783034b82f7a': 'conversation_participants_user',
      'FK_5d93fb1843f96fbdefea37dae86': 'conversation_participants_user',
      'FK_79cfe56699b0d98daa8c0b74cc1': 'delegations',
      'FK_3a14895e951f699c636e428f797': 'message_photos',
      'FK_5bb7f97934c3dfa9e033a61990b': 'message_photos',
      'FK_e5663ce0c730b2de83445e2fd19': 'messages',
      'FK_2db9cf2b3ca111742793f6c37ce': 'messages',
      'FK_8ba8ff09a3de183a4e9d04a9f2c': 'records',
      'FK_a1b1047f264c3755821a6b1c911': 'records',
      'FK_62e00d0e0c1af6ddc791a735cae': 'users',
      'FK_2c69c851bdaed5b02825d6f6d50': 'users',
      'FK_0a73ef18b47dedcb9a27d49d7e7': 'vehicle_photos',
      'FK_1581acde2264db5bf6cbd047ba8': 'vehicle_photos',
      'FK_feccd835ad29c718a632a025e44': 'vehicle_roster_reports',
      'FK_dad741fdcfccf62750814e74654': 'vehicle_roster_reports',
      'FK_633589096e47a16157d5a46f323': 'vehicle_roster_reports',
      'FK_be583da936658ab8febbca498e6': 'vehicle_transfers',
      'FK_b7df0dd906ecc8a8df2b87de72b': 'vehicle_transfers',
      'FK_2e7a40a8eecb6a9de7bf9064ba6': 'vehicle_transfers',
      'FK_08dff63990dff9b2c400acc4b45': 'vehicle_transfers',
    };
    return map[name] ?? 'users';
  }

  public async down(): Promise<void> {
    // No-op: dropping constraints is not reversible automatically
  }
}
