import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LicensePlan } from './schemas/license-plan.schema';
import { UserLicense } from './schemas/user-license.schema';
import { Item } from '../items/item.schema';
import { Outfit } from '../outfits/outfit.schema';
import { SubscribeDto } from './dto/subscribe.dto';
import { LicenseResponseDto } from './dto/license-response.dto';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';

@Injectable()
export class LicenseService {
  private readonly logger = new Logger(LicenseService.name);

  constructor(
    @InjectModel(LicensePlan.name)
    private licensePlanModel: Model<LicensePlan>,
    @InjectModel(UserLicense.name)
    private userLicenseModel: Model<UserLicense>,
    @InjectModel(Item.name)
    private itemModel: Model<Item>,
    @InjectModel(Outfit.name)
    private outfitModel: Model<Outfit>,
  ) {}

  // ─── Seed Plans ──────────────────────────────────────────────────────────
  async seedPlans(): Promise<void> {
    const defaultPlans = [
      {
        name: 'free',
        displayName: 'Free',
        price: 0,
        limits: {
          maxItems: 50,
          maxOutfits: 10,
          aiFeatures: false,
          importExport: false,
          analytics: false,
        },
      },
      {
        name: 'pro',
        displayName: 'Pro',
        price: 9,
        limits: {
          maxItems: 200,
          maxOutfits: 50,
          aiFeatures: true,
          importExport: true,
          analytics: false,
        },
      },
      {
        name: 'premium',
        displayName: 'Premium',
        price: 19,
        limits: {
          maxItems: -1,
          maxOutfits: -1,
          aiFeatures: true,
          importExport: true,
          analytics: true,
        },
      },
    ];

    for (const plan of defaultPlans) {
      const exists = await this.licensePlanModel.findOne({ name: plan.name });
      if (!exists) {
        await new this.licensePlanModel(plan).save();
        this.logger.log(`Seeded license plan: ${plan.displayName}`);
      }
    }
  }

  // ─── Get All Active Plans (Public) ────────────────────────────────────────
  async getPlans(): Promise<LicensePlan[]> {
    return this.licensePlanModel
      .find({ isActive: true })
      .sort({ price: 1 })
      .lean()
      .exec();
  }

  // ─── Get User License ────────────────────────────────────────────────────
  async getUserLicense(userId: string): Promise<LicenseResponseDto> {
    let userLicense = await this.userLicenseModel.findOne({
      userId: new Types.ObjectId(userId),
    });

    // Auto-create Free license if none exists
    if (!userLicense) {
      userLicense = await new this.userLicenseModel({
        userId: new Types.ObjectId(userId),
        plan: 'free',
        status: 'active',
        startedAt: new Date(),
        expiresAt: null,
      }).save();
      this.logger.log(`Auto-created Free license for user ${userId}`);
    }

    // Check expiry — if expired, treat as free
    const effectivePlan =
      userLicense.expiresAt &&
      userLicense.expiresAt < new Date() &&
      userLicense.plan !== 'free'
        ? 'free'
        : userLicense.plan;

    const plan = await this.licensePlanModel
      .findOne({ name: effectivePlan })
      .lean();
    if (!plan) {
      throw new NotFoundException(`Plan '${effectivePlan}' not found`);
    }

    return {
      plan: userLicense.plan,
      status:
        userLicense.expiresAt && userLicense.expiresAt < new Date()
          ? 'expired'
          : userLicense.status,
      startedAt: userLicense.startedAt,
      expiresAt: userLicense.expiresAt,
      limits: plan.limits,
    };
  }

  // ─── Subscribe / Change Plan ──────────────────────────────────────────────
  async subscribe(
    userId: string,
    dto: SubscribeDto,
  ): Promise<LicenseResponseDto> {
    const plan = await this.licensePlanModel.findOne({
      name: dto.plan,
      isActive: true,
    });
    if (!plan) {
      throw new BadRequestException(`Plan '${dto.plan}' is not available`);
    }

    const now = new Date();
    const expiresAt =
      dto.plan === 'free'
        ? null
        : new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days

    const userLicense = await this.userLicenseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        plan: dto.plan,
        status: 'active',
        startedAt: now,
        expiresAt,
      },
      { upsert: true, new: true },
    );

    this.logger.log(`User ${userId} subscribed to ${dto.plan}`);

    return {
      plan: userLicense.plan,
      status: userLicense.status,
      startedAt: userLicense.startedAt,
      expiresAt: userLicense.expiresAt,
      limits: plan.limits,
    };
  }

  // ─── Check Counted Limit (items / outfits) ───────────────────────────────
  async checkLimit(
    userId: string,
    feature: 'items' | 'outfits',
  ): Promise<boolean> {
    const licenseData = await this.getUserLicense(userId);
    const limitKey = feature === 'items' ? 'maxItems' : 'maxOutfits';
    const limit = licenseData.limits[limitKey];

    // Unlimited
    if (limit === -1) return true;

    // Count current resources
    const model = feature === 'items' ? this.itemModel : this.outfitModel;
    const currentCount = await model.countDocuments({
      owner: new Types.ObjectId(userId),
    } as any);

    return currentCount < limit;
  }

  // ─── Check Boolean Feature Gate ───────────────────────────────────────────
  async checkFeature(
    userId: string,
    feature: 'aiFeatures' | 'importExport' | 'analytics',
  ): Promise<boolean> {
    const licenseData = await this.getUserLicense(userId);
    return licenseData.limits[feature];
  }

  // ─── Admin: Get All User Licenses ─────────────────────────────────────────
  async adminGetAll(
    page: number,
    limit: number,
  ): Promise<{ data: UserLicense[]; total: number }> {
    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.userLicenseModel
        .find()
        .populate('userId', 'email firstName lastName')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.userLicenseModel.countDocuments(),
    ]);
    return { data, total };
  }

  // ─── Admin: Override User Plan ────────────────────────────────────────────
  async adminSetPlan(
    userId: string,
    plan: string,
  ): Promise<LicenseResponseDto> {
    const planDoc = await this.licensePlanModel.findOne({ name: plan });
    if (!planDoc) {
      throw new NotFoundException(`Plan '${plan}' not found`);
    }

    const userLicense = await this.userLicenseModel.findOneAndUpdate(
      { userId: new Types.ObjectId(userId) },
      {
        userId: new Types.ObjectId(userId),
        plan,
        status: 'active',
        startedAt: new Date(),
        expiresAt: null, // Manual override — no expiry
      },
      { upsert: true, new: true },
    );

    this.logger.log(`Admin overrode user ${userId} to plan ${plan}`);

    return {
      plan: userLicense.plan,
      status: userLicense.status,
      startedAt: userLicense.startedAt,
      expiresAt: userLicense.expiresAt,
      limits: planDoc.limits,
    };
  }

  // ─── Admin: Create Plan ───────────────────────────────────────────────────
  async adminCreatePlan(dto: CreatePlanDto): Promise<LicensePlan> {
    const exists = await this.licensePlanModel.findOne({ name: dto.name });
    if (exists) {
      throw new BadRequestException(`Plan '${dto.name}' already exists`);
    }
    return new this.licensePlanModel(dto).save();
  }

  // ─── Admin: Update Plan ───────────────────────────────────────────────────
  async adminUpdatePlan(
    planId: string,
    dto: UpdatePlanDto,
  ): Promise<LicensePlan> {
    const updated = await this.licensePlanModel.findByIdAndUpdate(
      planId,
      dto,
      { new: true },
    );
    if (!updated) {
      throw new NotFoundException(`Plan with id '${planId}' not found`);
    }
    return updated;
  }
}
