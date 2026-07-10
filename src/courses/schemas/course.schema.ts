import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type CourseDocument = Course & Document;

@Schema({ timestamps: true })
export class Course {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ type: Types.ObjectId, ref: 'User', required: true })
  instructorId: Types.ObjectId;

  @Prop({ required: true })
  price: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop()
  thumbnailUrl: string;

  @Prop({ type: [Types.ObjectId], ref: 'Module', default: [] })
  modules: Types.ObjectId[];

  @Prop({ default: 0 })
  enrollmentCount: number;
}

export const CourseSchema = SchemaFactory.createForClass(Course);

CourseSchema.index({ title: 'text', description: 'text' });
CourseSchema.index({ instructorId: 1 });
CourseSchema.index({ isPublished: 1 });
