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
exports.LocationSchema = exports.Location = exports.NodeType = void 0;
const mongoose_1 = require("@nestjs/mongoose");
const mongoose_2 = require("mongoose");
var NodeType;
(function (NodeType) {
    NodeType["LOCATION"] = "LOCATION";
    NodeType["HOUSE"] = "HOUSE";
    NodeType["ROOM"] = "ROOM";
    NodeType["CABINET"] = "CABINET";
    NodeType["SHELF"] = "SHELF";
    NodeType["BOX"] = "BOX";
})(NodeType || (exports.NodeType = NodeType = {}));
let Location = class Location extends mongoose_2.Document {
    name;
    type;
    parent;
    path;
    owner;
};
exports.Location = Location;
__decorate([
    (0, mongoose_1.Prop)({ required: true, trim: true }),
    __metadata("design:type", String)
], Location.prototype, "name", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: String, enum: NodeType, required: true }),
    __metadata("design:type", String)
], Location.prototype, "type", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'Location', default: null }),
    __metadata("design:type", Object)
], Location.prototype, "parent", void 0);
__decorate([
    (0, mongoose_1.Prop)({ index: true }),
    __metadata("design:type", String)
], Location.prototype, "path", void 0);
__decorate([
    (0, mongoose_1.Prop)({ type: mongoose_2.Types.ObjectId, ref: 'User', required: true }),
    __metadata("design:type", Object)
], Location.prototype, "owner", void 0);
exports.Location = Location = __decorate([
    (0, mongoose_1.Schema)({ timestamps: true })
], Location);
exports.LocationSchema = mongoose_1.SchemaFactory.createForClass(Location);
//# sourceMappingURL=location.schema.js.map