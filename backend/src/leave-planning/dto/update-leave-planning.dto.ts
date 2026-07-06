import { PartialType } from '@nestjs/mapped-types';
import { CreateLeavePlanningDto } from './create-leave-planning.dto';

export class UpdateLeavePlanningDto extends PartialType(CreateLeavePlanningDto) {}
