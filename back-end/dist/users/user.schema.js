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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserSchema = exports.User = exports.StylePreferences = exports.BodyMeasurements = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
let BodyMeasurements = class BodyMeasurements {
    height;
    weight;
    chest;
    waist;
    hips;
};
exports.BodyMeasurements = BodyMeasurements;
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BodyMeasurements.prototype, "height", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BodyMeasurements.prototype, "weight", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BodyMeasurements.prototype, "chest", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BodyMeasurements.prototype, "waist", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Number)
], BodyMeasurements.prototype, "hips", void 0);
exports.BodyMeasurements = BodyMeasurements = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], BodyMeasurements);
let StylePreferences = class StylePreferences {
    favoriteStyles;
    colorPalette;
};
exports.StylePreferences = StylePreferences;
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], StylePreferences.prototype, "favoriteStyles", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: [String], default: [] }),
    __metadata("design:type", Array)
], StylePreferences.prototype, "colorPalette", void 0);
exports.StylePreferences = StylePreferences = __decorate([
    (0, mongoose_1.Schema)({ _id: false })
], StylePreferences);
let User = class User extends mongoose_2.Document {
    email;
    password;
    firstName;
    lastName;
    phone;
    dateOfBirth;
    bio;
    avatarUrl;
    measurements;
    stylePreferences;
    isActive;
};
exports.User = User;
__decorate([
    (0, mongoose_1.Prop)({ required: true, unique: true }),
    __metadata("design:type", String)
], User.prototype, "email", void 0);
__decorate([
    (0, mongoose_1.Prop)({ required: true }),
    __metadata("design:type", String)
], User.prototype, "password", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "firstName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "lastName", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "phone", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", Date)
], User.prototype, "dateOfBirth", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "bio", void 0);
__decorate([
    (0, mongoose_1.Prop)(),
    __metadata("design:type", String)
], User.prototype, "avatarUrl", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: BodyMeasurements, default: {} }),
    __metadata("design:type", BodyMeasurements)
], User.prototype, "measurements", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: StylePreferences, default: { favoriteStyles: [], colorPalette: [] } }),
    __metadata("design:type", StylePreferences)
], User.prototype, "stylePreferences", void 0);
__decorate([
    (0, mongoose_1.Prop)({ default: true }),
    __metadata("design:type", Boolean)
], User.prototype, "isActive", void 0);
exports.User = User = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], User);
exports.UserSchema = mongoose_1.SchemaFactory.createForClass(User);
//# sourceMappingURL=user.schema.js.map