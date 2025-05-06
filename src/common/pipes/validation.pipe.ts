import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }

    // Handle null and undefined values
    if (value === undefined || value === null) {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      const messages = errors
        .map(error => {
          const constraints = error.constraints || {};
          return Object.values(constraints).join(', ');
        })
        .join('; ');

      throw new BadRequestException(messages);
    }

    // Strip unknown properties
    const cleanObject = plainToInstance(metatype, value, { 
      excludeExtraneousValues: true 
    });
    
    return cleanObject;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }
}