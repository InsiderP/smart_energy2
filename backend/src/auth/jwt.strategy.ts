import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'your-secret-key',
      issuer: 'iot-monitor'
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.userModel.findById(payload.sub);
      
      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      // Return minimal user data needed for requests
      return {
        userId: user._id,
        email: user.email,
        role: user.role
      };
    } catch (error) {
      console.error('JWT validation error:', {
        error: error.message,
        payload,
      });
      throw new UnauthorizedException('Invalid token');
    }
  }
} 