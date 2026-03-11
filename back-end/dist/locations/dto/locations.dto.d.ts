import { NodeType } from '../location.schema';
export declare class CreateLocationDto {
    name: string;
    type: NodeType;
    parent?: string;
}
export declare class UpdateLocationDto {
    name?: string;
    type?: NodeType;
    parent?: string;
}
