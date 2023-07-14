import { UUID } from '../../lib/global.type';

export interface UpdateUserDto {
  /**
   * @isUUID
   */
  id: UUID;

  /**
   * @isString
   * @isNotEmpty
   */
  firstName: string;

  /**
   * @isString
   * @isNotEmpty
   */
  lastName: string;

  /**
   * @isString
   * @isEmail
   * @isNotEmpty
   * @pattern ^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$ Invalid email
   */
  email: string;

  /**
   * @isPhoneNumber
   * @isNotEmpty
   * @pattern ^\d{10,11}$ Invalid phone number
   */
  phone: string;
}
