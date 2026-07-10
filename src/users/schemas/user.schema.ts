import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import { Role } from '../../common/enums/role.enum';

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, lowercase: true })
  email: string;

  @Prop({ required: true })
  password: string;

  @Prop({ type: String, enum: Role, default: Role.STUDENT })
  role: Role;

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ type: [String], default: [] })
  enrolledCourses: string[];

  @Prop({
    type: [
      {
        deviceId: String,
        deviceName: String,
        sessionId: String,
        lastActive: Date,
      },
    ],
    default: [],
  })
  activeSessions: {
    deviceId: string;
    deviceName: string;
    sessionId: string;
    lastActive: Date;
  }[];
}

export const UserSchema = SchemaFactory.createForClass(User);

// Index for faster queries
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
