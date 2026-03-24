export declare class CreateItemDto {
    name: string;
    description?: string;
    price?: number;
    brand?: string;
    category?: string;
    color?: string;
    size?: string;
    style?: string;
    season?: string;
    tags?: string[];
    location: string;
}
export declare class UpdateItemDto {
    name?: string;
    description?: string;
    price?: number;
    brand?: string;
    category?: string;
    color?: string;
    size?: string;
    style?: string;
    season?: string;
    tags?: string[];
    location?: string;
}
