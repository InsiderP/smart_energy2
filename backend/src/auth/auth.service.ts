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
    console.log('Validating user:', email); // Debug log
    
    const user = await this.userModel.findOne({ email });
    if (!user) {
      console.log('User not found:', email); // Debug log
      return null;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    console.log('Password validation:', isPasswordValid); // Debug log

    if (isPasswordValid) {
      const { password, ...result } = user.toObject();
      return result;
    }
    return null;
  }

  async login(user: any) {
    console.log('Generating token for user:', user.email); // Debug log
    
    const payload = { email: user.email, sub: user._id, role: user.role };
    const access_token = this.jwtService.sign(payload);
    
    console.log('Token generated successfully'); // Debug log
    
    return {
      access_token,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  async register(userData: { name: string; email: string; password: string }) {
    console.log('Registering new user:', userData.email); // Debug log
    
    const existingUser = await this.userModel.findOne({ email: userData.email });
    if (existingUser) {
      console.log('User already exists:', userData.email); // Debug log
      throw new UnauthorizedException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const newUser = new this.userModel({
      ...userData,
      password: hashedPassword,
    });

    const savedUser = await newUser.save();
    console.log('User registered successfully:', userData.email); // Debug log
    
    const { password, ...result } = savedUser.toObject();
    return result;
  }
} 