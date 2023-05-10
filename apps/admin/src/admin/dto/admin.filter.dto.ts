import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsOptional } from 'class-validator';
import { CursorFilterDto } from 'app/libs/common/pagination/cursor-filter.dto';
import { Admin } from '@admin/admin/admin.entity';

export class AdminFilterDto extends CursorFilterDto {
  @ApiProperty({ example: 'createdAt', enum: ['createdAt'], required: false })
  @IsOptional()
  @IsIn(['createdAt'])
  orderParam: keyof Admin = 'createdAt';
}
