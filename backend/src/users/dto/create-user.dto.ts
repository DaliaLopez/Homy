import { UserRole } from "../user.interface";

export class CreateUserDto {
  name!: string;
  email!: string;
  phone!: string;
  location!: string;
  role!: UserRole;
}