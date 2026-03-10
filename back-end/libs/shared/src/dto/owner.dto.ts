import { IsEmail, IsNotEmpty, IsString, MinLength } from "class-validator";

export class OwnerDto {
    @IsEmail({}, { message: 'Email không đúng định dạng' })
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    authId: string;

    @IsString()
    firstName: string;
    
    @IsString()
    @IsNotEmpty()
    lastName: string;
}
