import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ModuleDocument = Module & Document;

@Schema({ timestamps: true })
export class Module {
  @Prop({ type: Types.ObjectId, ref: 'Course', required: true })
  courseId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  sequenceOrder: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({
    type: [
      {
        title: String,
        fileUrl: String,
        isDownloadable: Boolean,
        uploadedAt: Date,
      },
    ],
    default: [],
  })
  sheets: {
    title: string;
    fileUrl: string;
    isDownloadable: boolean;
    uploadedAt: Date;
  }[];

  @Prop({
    type: [
      {
        title: String,
        videoUrl: String,
        duration: Number,
        hlsPlaylistUrl: String,
      },
    ],
    default: [],
  })
  videos: {
    title: string;
    videoUrl: string;
    duration: number;
    hlsPlaylistUrl: string;
  }[];
}

export const ModuleSchema = SchemaFactory.createForClass(Module);

ModuleSchema.index({ courseId: 1, sequenceOrder: 1 });
