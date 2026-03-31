"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const app_controller_1 = require("./app.controller");
const app_service_1 = require("./app.service");
const common_module_1 = require("./common/common.module");
const users_module_1 = require("./users/users.module");
const auth_module_1 = require("./auth/auth.module");
const items_module_1 = require("./items/items.module");
const locations_module_1 = require("./locations/locations.module");
const favorites_module_1 = require("./favorites/favorites.module");
const cloudinary_module_1 = require("./cloudinary/cloudinary.module");
const config_1 = require("@nestjs/config");
const mongoose_1 = require("@nestjs/mongoose");
const outfits_module_1 = require("./outfits/outfits.module");
const weather_module_1 = require("./weather/weather.module");
const recommendation_module_1 = require("./recommendation/recommendation.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            mongoose_1.MongooseModule.forRootAsync({
                imports: [config_1.ConfigModule],
                useFactory: async (configService) => ({
                    uri: configService.get('MONGO_URI'),
                }),
                inject: [config_1.ConfigService],
            }),
            common_module_1.CommonModule,
            users_module_1.UsersModule,
            auth_module_1.AuthModule,
            items_module_1.ItemsModule,
            locations_module_1.LocationsModule,
            favorites_module_1.FavoritesModule,
            cloudinary_module_1.CloudinaryModule,
            outfits_module_1.OutfitsModule,
            weather_module_1.WeatherModule,
            recommendation_module_1.RecommendationModule,
            dashboard_module_1.DashboardModule,
        ],
        controllers: [app_controller_1.AppController],
        providers: [app_service_1.AppService],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map