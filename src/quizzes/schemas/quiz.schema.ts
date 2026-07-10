import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type QuizDocument = Quiz & Document;

@Schema({ timestamps: true })
export class Quiz {
  @Prop({ type: Types.ObjectId, ref: 'Module', required: true })
  moduleId: Types.ObjectId;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  duration: number; // in minutes

  @Prop({ required: true })
  totalMarks: number;

  @Prop({ default: 0 })
  passingMarks: number;

  @Prop({ default: true })
  isPublished: boolean;

  @Prop({
    type: [
      {
        questionText: String,
        options: [
          {
            optionIndex: Number,
            text: String,
          },
        ],
        correctOptionIndex: Number,
        explanation: String,
        negativeMarking: Number,
      },
    ],
    default: [],
  })
  questions: {
    questionText: string;
    options: {
      optionIndex: number;
      text: string;
    }[];
    correctOptionIndex: number;
    explanation: string;
    negativeMarking: number;
  }[];
}

export const QuizSchema = SchemaFactory.createForClass(Quiz);

QuizSchema.index({ moduleId: 1 });
