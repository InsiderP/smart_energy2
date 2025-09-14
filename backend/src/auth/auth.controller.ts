import { Controller, Post, Body, UnauthorizedException, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto, RegisterDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() loginData: LoginDto) {
    console.log('Login attempt received for:', loginData.email);

    try {
      // Validate user
      console.log('Validating user credentials....');
      const user = await this.authService.validateUser(
        loginData.email,
        loginData.password,
      );
      
      if (!user) {
        console.log('Invalid credentials for:', loginData.email);
        throw new UnauthorizedException('Invalid credentials');
      }

      console.log('User validated successfully:', { email: user.email, id: user._id });
      
      // Generate token and login
      console.log('Generating authentication token...');
      const result = await this.authService.login(user);
      
      console.log('Login successful for:', loginData.email);
      return result;
    } catch (error) {
      console.error('Login error:', {
        email: loginData.email,
        error: error.message,
        stack: error.stack
      });
      
      // Handle specific error types
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Login failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('register')
  async register(@Body() registerData: RegisterDto) {
    console.log('Registration attempt received for:', registerData.email);

    try {
      const result = await this.authService.register(registerData);
      console.log('Registration successful for:', registerData.email);
      return result;
    } catch (error) {
      console.error('Registration error:', {
        email: registerData.email,
        error: error.message,
        stack: error.stack
      });
      
      // Handle specific error types
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Registration failed',
        error.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
} 