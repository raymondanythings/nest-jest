import { InputType, ObjectType, PartialType } from '@nestjs/graphql';
import { User } from '../entities/user.entity';
import { CoreOutput } from './output.dto';

@InputType()
export class CreateAccountInput extends PartialType(User) {}

@ObjectType()
export class CreateAccountOutput extends CoreOutput {}
