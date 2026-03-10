import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AuthServiceController } from './auth-service.controller';
import { AuthServiceService } from './auth-service.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CommonConfigModule, User, UserSchema } from '@app/shared'; // Sử dụng alias path
import { JwtModule } from '@nestjs/jwt';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    CommonConfigModule,
    // MongooseModule.forRoot(process.env.MONGO_AUTH_URI || 'mongodb://auth-db:27017/wardrobe_auth'),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        uri: config.get<string>('MONGO_AUTH_URI'),
      }),
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),JwtModule.register({ secret: 'SECRET_KEY', signOptions: { expiresIn: '1h' } }),
    // ClientsModule.register([
    //   {
    //     name: 'RABBIT_SERVICE',
    //     transport: Transport.RMQ,
    //     options: {
    //       urls: [process.env.RMQ_URL || 'amqp://localhost:5672'],
    //       queue: 'inventory_queue',
    //       queueOptions: { durable: false },
    //     },
    //   },
    // ]),
    ClientsModule.registerAsync([
      {
        name: 'RABBIT_SERVICE',
        inject: [ConfigService],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.RMQ,
          options: {
            // Thêm giá trị mặc định hoặc ép kiểu
            urls: [configService.get<string>('RMQ_URL') || 'amqp://localhost:5672'], 
            queue: configService.get<string>('RMQ_INVENTORY_QUEUE') || 'inventory_queue',
            queueOptions: { durable: false },
          },
        }),
      },
    ]),
  ],
  controllers: [AuthServiceController],
  providers: [AuthServiceService],
})
export class AuthServiceModule {}
