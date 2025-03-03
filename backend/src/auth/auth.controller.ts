import { Controller, Post, Body, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: { email: string; password: string }) {
    console.log('Login attempt for:', loginData.email); // Debug log

    try {
      const user = await this.authService.validateUser(
        loginData.email,
        loginData.password,
      );
      
      if (!user) {
        console.log('Invalid credentials for:', loginData.email); // Debug log
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('User validated successfully:', loginData.email); // Debug log
      const result = await this.authService.login(user);
      console.log('Login successful for:', loginData.email); // Debug log
      return result;
    } catch (error) {
      console.error('Login error:', error); // Debug log
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register')
  async register(
    @Body() registerData: { name: string; email: string; password: string },
  ) {
    console.log('Registration attempt for:', registerData.email); // Debug log

    try {
      const result = await this.authService.register(registerData);
      console.log('Registration successful for:', registerData.email); // Debug log
      return result;
    } catch (error) {
      console.error('Registration error:', error); // Debug log
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 