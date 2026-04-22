import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from 'src/common/enums/role.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UserEntity } from './entities/user.entity';
import { UsersService } from './users.service';

@Injectable()
export class SuperadminBootstrapService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SuperadminBootstrapService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly usersService: UsersService,
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
  ) {}

  async onApplicationBootstrap() {
    const superadminEmail = this.configService
      .get<string>('SUPERADMIN_EMAIL')
      ?.trim()
      .toLowerCase();
    const superadminPassword = this.configService.get<string>('SUPERADMIN_PASSWORD')?.trim();
    const superadminFirstName =
      this.configService.get<string>('SUPERADMIN_FIRST_NAME')?.trim() || 'Super';
    const superadminLastName =
      this.configService.get<string>('SUPERADMIN_LAST_NAME')?.trim() || 'Administrador';
    const superadminGrade =
      this.configService.get<string>('SUPERADMIN_GRADE')?.trim() || 'N/A';
    const superadminPhone =
      this.configService.get<string>('SUPERADMIN_PHONE')?.trim() || '0000000000';

    if (!superadminEmail || !superadminPassword) {
      this.logger.warn(
        'SUPERADMIN_EMAIL or SUPERADMIN_PASSWORD is missing. Initial superadmin bootstrap was skipped.',
      );
      return;
    }

    const existingUser = await this.userRepository.findOne({
      where: { email: superadminEmail },
      withDeleted: true,
    });

    if (existingUser) {
      this.logger.log(`Initial superadmin bootstrap skipped. ${superadminEmail} already exists.`);
      return;
    }

    const dto: CreateUserDto = {
      firstName: superadminFirstName,
      lastName: superadminLastName,
      grade: superadminGrade,
      phone: superadminPhone,
      email: superadminEmail,
      password: superadminPassword,
      role: Role.SuperAdmin,
    };

    await this.usersService.create(dto);

    this.logger.log(`Initial superadmin created for ${superadminEmail}.`);
  }
}
