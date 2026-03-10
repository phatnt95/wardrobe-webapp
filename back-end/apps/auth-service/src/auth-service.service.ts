import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '@app/shared';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { ClientProxy } from '@nestjs/microservices';

@Injectable()
export class AuthServiceService {
  constructor(
    @InjectModel(User.name) private userModel: Model<User>,
    @Inject('RABBIT_SERVICE') private client: ClientProxy, // Inject RabbitMQ Client
    private jwtService: JwtService,
  ) {}

  async register(dto: any) {
    const { email, password } = dto;
    const exists = await this.userModel.findOne({ email });
    if (exists) throw new BadRequestException('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await this.userModel.create({ ...dto, password: hashedPassword });

    // --- EVENT-DRIVEN: Bắn sự kiện sang Inventory Service ---
    this.client.emit('user_created', {
      authId: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    });

    console.log('emit: ', this.client);

    return { message: 'User registered successfully', userId: user._id };
  }

  async login(dto: any) {
    const user = await this.userModel.findOne({ email: dto.email });
    if (!user || !(await bcrypt.compare(dto.password, user.password))) {
      throw new BadRequestException('Invalid credentials');
    }

    const payload = { sub: user._id, email: user.email };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }
}
