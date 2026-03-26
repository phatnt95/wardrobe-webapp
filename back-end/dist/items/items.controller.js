"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const platform_express_1 = require("@nestjs/platform-express");
const items_service_1 = require("./items.service");
const items_dto_1 = require("./dto/items.dto");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let ItemsController = class ItemsController {
    itemsService;
    constructor(itemsService) {
        this.itemsService = itemsService;
    }
    create(createItemDto, file, user) {
        return this.itemsService.create(createItemDto, file, user._id);
    }
    findAll(user) {
        return this.itemsService.findAll(user._id);
    }
    findAllAttributes() {
        return this.itemsService.findAllAttributes();
    }
    createAttribute(type, body) {
        return this.itemsService.createAttribute(type, body.name);
    }
    updateAttribute(type, id, body) {
        return this.itemsService.updateAttribute(type, id, body.name);
    }
    removeAttribute(type, id) {
        return this.itemsService.removeAttribute(type, id);
    }
    findOne(id, user) {
        return this.itemsService.findOne(id, user._id);
    }
    update(id, updateItemDto, file, user) {
        return this.itemsService.update(id, updateItemDto, file, user._id);
    }
    remove(id, user) {
        return this.itemsService.remove(id, user._id);
    }
};
exports.ItemsController = ItemsController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                location: { type: 'string' },
                brand: { type: 'string' },
                category: { type: 'string' },
                color: { type: 'string' },
                size: { type: 'string' },
                style: { type: 'string' },
                seasonCode: { type: 'string' },
                neckline: { type: 'string' },
                occasion: { type: 'string' },
                sleeveLength: { type: 'string' },
                shoulder: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [items_dto_1.CreateItemDto, Object, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)('attributes'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all item attributes/metadata grouped by type' }),
    (0, swagger_1.ApiResponse)({
        status: 200,
        description: 'Return grouped metadata like Brand, Category, etc.',
    }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findAllAttributes", null);
__decorate([
    (0, common_1.Post)('attributes/:type'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new metadata attribute' }),
    (0, swagger_1.ApiBody)({
        schema: { type: 'object', properties: { name: { type: 'string' } } },
    }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "createAttribute", null);
__decorate([
    (0, common_1.Patch)('attributes/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Update an existing metadata attribute' }),
    (0, swagger_1.ApiBody)({
        schema: { type: 'object', properties: { name: { type: 'string' } } },
    }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "updateAttribute", null);
__decorate([
    (0, common_1.Delete)('attributes/:type/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete a metadata attribute' }),
    __param(0, (0, common_1.Param)('type')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "removeAttribute", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiBody)({
        schema: {
            type: 'object',
            properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                price: { type: 'number' },
                location: { type: 'string' },
                brand: { type: 'string' },
                category: { type: 'string' },
                color: { type: 'string' },
                size: { type: 'string' },
                style: { type: 'string' },
                seasonCode: { type: 'string' },
                neckline: { type: 'string' },
                occasion: { type: 'string' },
                sleeveLength: { type: 'string' },
                shoulder: { type: 'string' },
                file: {
                    type: 'string',
                    format: 'binary',
                },
            },
        },
    }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, common_1.UploadedFile)()),
    __param(3, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, items_dto_1.UpdateItemDto, Object, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", void 0)
], ItemsController.prototype, "remove", null);
exports.ItemsController = ItemsController = __decorate([
    (0, swagger_1.ApiTags)('items'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, common_1.Controller)('items'),
    __metadata("design:paramtypes", [items_service_1.ItemsService])
], ItemsController);
//# sourceMappingURL=items.controller.js.map