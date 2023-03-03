import { ApiProperty } from '@nestjs/swagger';
import { Fee } from '@src/fee/fee.entity';
import { Exclude } from 'class-transformer';
import { Column, Entity, PrimaryGeneratedColumn, OneToMany, JoinColumn } from 'typeorm';
import { PersonProfile } from '@src/person-profile/person-profile.entity';

@Entity('country')
export class Country {
  @Exclude({ toPlainOnly: true })
  @PrimaryGeneratedColumn({ name: 'id' })
  id: number;

  @ApiProperty({ description: 'Country name', maximum: 128, required: false })
  @Column({ type: 'varchar', nullable: false, length: 128 })
  name: string;

  @ApiProperty({ description: 'Country code', maximum: 128, required: false })
  @Column({ type: 'varchar', nullable: false, length: 128 })
  countryCode: string;

  @ApiProperty({ description: 'Phone code', maximum: 128, required: false })
  @Column({ type: 'varchar', nullable: false, length: 128 })
  phoneCode: string;

  @ApiProperty({
    description: 'If the country is active now.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  isActive: boolean;

  @ApiProperty({
    description: 'Message if the country is inactive',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, default: '', length: 128 })
  inactiveMessage: string;

  @ApiProperty({
    description: 'If the country is in maintenance.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: false })
  inMaintenance: boolean;

  @ApiProperty({
    description: 'Message if the country is in maintenance',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  inMaintenanceMessage: string;

  @ApiProperty({
    description: 'If deposit is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  depositActivated: boolean;

  @ApiProperty({
    description: 'Message if deposit is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  depositMessage: string;

  @ApiProperty({
    description: 'If withdraw is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  withdrawActivated: boolean;

  @ApiProperty({
    description: 'Message if withdraw is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  withdrawMessage: string;

  @ApiProperty({
    description: 'If transfer is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  transferActivated: boolean;

  @ApiProperty({
    description: 'Message if transfer is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  transferMessage: string;

  @ApiProperty({
    description: 'If card is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  cardActivated: boolean;

  @ApiProperty({
    description: 'Message if card is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  cardMessage: string;

  @ApiProperty({
    description: 'If card multiple is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  cardMultipleActivated: boolean;

  @ApiProperty({
    description: 'Message if card multiple is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  cardMultipleMessage: string;

  @ApiProperty({
    description: 'If card unique is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  cardUniqueActivated: boolean;

  @ApiProperty({
    description: 'Message if card unique is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  cardUniqueMessage: string;

  @ApiProperty({
    description: 'If card physic is active in this country.',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'boolean', nullable: false, default: true })
  cardPhysicActivated: boolean;

  @ApiProperty({
    description: 'Message if card physic is not available in this country',
    maximum: 128,
    required: false,
  })
  @Column({ type: 'varchar', nullable: false, length: 128, default: '' })
  cardPhysicMessage: string;

  @OneToMany(() => PersonProfile, (personProfile) => personProfile.country)
  @JoinColumn({ name: 'id', referencedColumnName: 'country_id' })
  personProfile: PersonProfile[];

  @OneToMany(() => Fee, (fee) => fee.country)
  @JoinColumn({ name: 'id', referencedColumnName: 'country_id' })
  fee: Fee[];
}
