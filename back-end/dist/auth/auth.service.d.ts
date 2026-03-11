import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    register(registerDto: any): Promise<{
        access_token: string;
    }>;
    login(loginDto: any): Promise<{
        access_token: string;
    }>;
}
