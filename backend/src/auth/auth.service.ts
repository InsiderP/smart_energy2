import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { User, UserDocument } from '../schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    console.log('Validating user:', email);
    
    try {
      const user = await this.userModel.findOne({ email });
      if (!user) {
        console.log('User not found:', email);
        return null;
      }

      console.log('Found user:', { email: user.email, id: user._id });
      const isPasswordValid = await bcrypt.compare(password, user.password);
      console.log('Password validation result:', isPasswordValid);

      if (isPasswordValid) {
        const { password, ...result } = user.toObject();
        return result;
      }
      return null;
    } catch (error) {
      console.error('Error validating user:', error);
      throw new UnauthorizedException('Error validating user credentials');
    }
  }

  async login(user: any) {
    console.log('Generating token for user:', { email: user.email, id: user._id });
    
    try {
      const payload = { 
        email: user.email, 
        sub: user._id.toString(),
        role: user.role || 'user'
      };
      
      console.log('Token payload:', payload);
      const access_token = this.jwtService.sign(payload);
      console.log('Token generated successfully');
      
      const userData = {
        id: user._id.toString(),
        email: user.email,
        name: user.name || '',
        role: user.role || 'user',
      };

      console.log('Returning user data:', userData);
      
      return {
        access_token,
        user: userData
      };
    } catch (error) {
      console.error('Error generating token:', error);
      throw new UnauthorizedException('Failed to generate authentication token');
    }
  }

  async register(userData: { name: string; email: string; password: string }) {
    console.log('Registering new user:', userData.email);
    
    try {
      const existingUser = await this.userModel.findOne({ email: userData.email });
      if (existingUser) {
        console.log('User already exists:', userData.email);
        throw new UnauthorizedException('User already exists');
      }

      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = new this.userModel({
        ...userData,
        password: hashedPassword,
      });

      const savedUser = await newUser.save();
      console.log('User registered successfully:', { email: userData.email, id: savedUser._id });
      
      const { password, ...result } = savedUser.toObject();
      return result;
    } catch (error) {
      console.error('Error registering user:', error);
      throw new UnauthorizedException(error.message || 'Failed to register user');
    }
  }
} 