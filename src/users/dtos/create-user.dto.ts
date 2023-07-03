import { UUID } from '../../lib/global.type';
import {
  IsEmail,
  IsPhoneNumber,
} from 'class-validator';

export interface CreateUserDto {
  /**
   * @isString
   * @isNotEmpty
   * @pattern ^DMS\d{6}$
   */
  code: string;

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

  department: {
    /**
     * @isUUID
     * @isNotEmpty
     * @isString
     */
    id: UUID;
  };
}
