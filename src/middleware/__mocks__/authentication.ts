import { NextFunction, Request, Response } from "express";

const jwtCheck = (req: Request, res: Response, next: NextFunction) => {
  next();
};

export default jwtCheck;
