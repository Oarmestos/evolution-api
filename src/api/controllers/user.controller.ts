import { UserService } from '@api/services/user.service';
import { Request, Response } from 'express';

export class UserController {
  constructor(private readonly userService: UserService) {}

  public async login(req: Request, res: Response) {
    const response = await this.userService.login(req.body);

    // Set cookie for server-side protection
    res.cookie('avri_token', response.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json(response);
  }

  public async register(req: Request, res: Response) {
    const response = await this.userService.register(req.body);
    return res.status(201).json(response);
  }
}
