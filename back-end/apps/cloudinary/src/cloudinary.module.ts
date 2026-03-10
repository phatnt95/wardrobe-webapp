import { Module } from '@nestjs/common';
import { CloudinaryController } from './cloudinary.controller';
import { CloudinaryService } from './cloudinary.service';
import { ConfigModule } from '@nestjs/config';
import { CloudinaryProvider } from './cloudinary.provider';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true, // Để các module khác không cần import lại ConfigModule
      envFilePath: '.env',
    }),
  ],
  controllers: [CloudinaryController],
  providers: [CloudinaryProvider, CloudinaryService],
})
export class CloudinaryModule {}
 