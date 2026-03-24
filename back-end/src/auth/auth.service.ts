import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class AuthService {
    constructor(
        private usersService: UsersService,
        private jwtService: JwtService,
    ) { }

    async register(registerDto: any) {
        const { email, password, firstName, lastName } = registerDto;

        // Check if user exists
        const existingUser = await this.usersService.findByEmail(email);
        if (existingUser) {
            throw new ConflictException('Email already in use');
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await this.usersService.create({
            email,
            password: hashedPassword,
            firstName,
            lastName,
        });

        const payload = { sub: user._id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async login(loginDto: any) {
        const { email, password } = loginDto;
        const user = await this.usersService.findByEmail(email);

        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const payload = { sub: user._id, email: user.email };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
}
