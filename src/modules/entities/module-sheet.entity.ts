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

@Entity('module_sheets')
export class ModuleSheet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  moduleId: string;

  @ManyToOne(() => Module, (module) => module.sheets)
  @JoinColumn({ name: 'moduleId' })
  module: Module;

  @Column({ type: 'varchar', length: 500 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'varchar', length: 1000 })
  fileName: string; // Unique filename on server

  @Column({ type: 'varchar', length: 1000 })
  fileUrl: string; // Full URL to access the file

  @Column({ type: 'boolean', default: true })
  isDownloadable: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'bigint' })
  fileSize: number; // File size in bytes

  @Column({ type: 'varchar', length: 50 })
  mimeType: string;

  @CreateDateColumn({ type: 'timestamp' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp' })
  updatedAt: Date;
}
