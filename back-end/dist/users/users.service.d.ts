import { Model } from 'mongoose';
import { User } from './user.schema';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
export declare class UsersService {
    private userModel;
    constructor(userModel: Model<User>);
    create(userDto: {
        email: string;
        password: string;
        firstName?: string;
        lastName?: string;
    }): Promise<User>;
    findByEmail(email: string): Promise<User | null>;
    findById(id: string): Promise<User | null>;
    getProfile(userId: string): Promise<User>;
    updateProfile(userId: string, dto: UpdateProfileDto): Promise<User>;
    updateAvatar(userId: string, avatarUrl: string): Promise<User>;
    changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;
}
