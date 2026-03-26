export declare class CreateItemDto {
    name: string;
    description?: string;
    price?: number;
    brand?: string;
    category?: string;
    color?: string;
    size?: string;
    style?: string;
    seasonCode?: string;
    neckline?: string;
    occasion?: string;
    sleeveLength?: string;
    shoulder?: string;
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
    seasonCode?: string;
    neckline?: string;
    occasion?: string;
    sleeveLength?: string;
    shoulder?: string;
    tags?: string[];
    location?: string;
}
