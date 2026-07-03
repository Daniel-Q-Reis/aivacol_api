import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserService } from './application/services/user.service';
import { USER_REPOSITORY } from './domain/interfaces/user-repository.interface';
import { UserOrmEntity } from './infrastructure/persistence/entities/user.orm-entity';
import { TypeOrmUserRepository } from './infrastructure/persistence/repositories/typeorm-user.repository';
import { UserController } from './presentation/controllers/user.controller';

@Module({
  imports: [TypeOrmModule.forFeature([UserOrmEntity])],
  controllers: [UserController],
  providers: [
    TypeOrmUserRepository,
    UserService,
    {
      provide: USER_REPOSITORY,
      useExisting: TypeOrmUserRepository,
    },
  ],
  exports: [USER_REPOSITORY, UserService],
})
export class UsersModule {}
