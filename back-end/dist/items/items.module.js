"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ItemsModule = void 0;
const common_1 = require("@nestjs/common");
const mongoose_1 = require("@nestjs/mongoose");
const items_service_1 = require("./items.service");
const items_controller_1 = require("./items.controller");
const item_schema_1 = require("./item.schema");
const cloudinary_module_1 = require("../cloudinary/cloudinary.module");
const metadata_schema_1 = require("./metadata.schema");
let ItemsModule = class ItemsModule {
};
exports.ItemsModule = ItemsModule;
exports.ItemsModule = ItemsModule = __decorate([
    (0, common_1.Module)({
        imports: [
            mongoose_1.MongooseModule.forFeature([
                { name: item_schema_1.Item.name, schema: item_schema_1.ItemSchema },
                { name: metadata_schema_1.Brand.name, schema: metadata_schema_1.BrandSchema },
                { name: metadata_schema_1.Category.name, schema: metadata_schema_1.CategorySchema },
                { name: metadata_schema_1.Neckline.name, schema: metadata_schema_1.NecklineSchema },
                { name: metadata_schema_1.Occasion.name, schema: metadata_schema_1.OccasionSchema },
                { name: metadata_schema_1.SeasonCode.name, schema: metadata_schema_1.SeasonCodeSchema },
                { name: metadata_schema_1.SleeveLength.name, schema: metadata_schema_1.SleeveLengthSchema },
                { name: metadata_schema_1.Style.name, schema: metadata_schema_1.StyleSchema },
                { name: metadata_schema_1.Size.name, schema: metadata_schema_1.SizeSchema },
                { name: metadata_schema_1.Shoulder.name, schema: metadata_schema_1.ShoulderSchema },
            ]),
            cloudinary_module_1.CloudinaryModule,
        ],
        controllers: [items_controller_1.ItemsController],
        providers: [items_service_1.ItemsService],
        exports: [items_service_1.ItemsService],
    })
], ItemsModule);
//# sourceMappingURL=items.module.js.map