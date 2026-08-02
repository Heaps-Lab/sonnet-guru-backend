import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Module } from './module.entity';

@Entity('videos')
export class Video {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.videos)
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 1000 })
  fileName: string; // Unique filename on server

  @Column({ type: 'varchar', length: 1000 })
  videoUrl: string; // Full URL to access the video

  @Column({ type: 'varchar', length: 1000, nullable: true })
  hlsPlaylistUrl: string; // HLS streaming URL

  @Column({ type: 'int' })
  duration: number; // Duration in seconds

  @Column({ type: 'int' })
  sequenceNumber: number; // Order within the module

  @Column({ type: 'boolean', default: true })
  isDownloadable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'bigint' })
  fileSize: number; // File size in bytes

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @Column({
    type: 'enum',
    enum: ['uploading', 'processing', 'ready', 'failed'],
    default: 'uploading',
  })
  status: string;

  @Column({ type: 'text', nullable: true })
  processingError: string; // Error message if processing fails

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
