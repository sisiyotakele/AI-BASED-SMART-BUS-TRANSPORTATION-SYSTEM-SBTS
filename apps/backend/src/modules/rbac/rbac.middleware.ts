import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Protect Middleware (Verifies the JWT token)
export const protect = async (req: Request, res: Response, next: NextFunction) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      
      // Decode and verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as any;
      
      // Attach the user data to the request object
      req.user = decoded; 
      return next();
    } catch (error) {
      return res.status(401).json({ message: 'Not authorized, token failed' });
    }
  }

  if (!token) {
    return res.status(401).json({ message: 'Not authorized, no token provided' });
  }
};

// 2. Role-Based Access Control (Restricts access by role)
export const authorizeRoles = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Assumes req.user.role was set by the protect middleware
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Forbidden: You do not have permission' });
    }
    next();
  };
};