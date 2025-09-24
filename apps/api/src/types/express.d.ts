/**
 * Express Type Declarations
 *
 * Global type definitions for Express.js middleware
 */

declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: string;
        role: string;
        fullName?: string;
        email?: string;
        phone?: string;
        hospitalId?: string;
      };
    }
  }
}

export {};