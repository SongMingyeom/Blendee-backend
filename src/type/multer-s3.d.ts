declare module "multer-s3" {
  import { StorageEngine } from "multer";
  import AWS from "aws-sdk";

  interface MulterS3Options {
    s3: AWS.S3;
    bucket: string;
    acl?: string;
    metadata?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: any, metadata?: any) => void
    ) => void;
    key?: (
      req: Express.Request,
      file: Express.Multer.File,
      cb: (error: any, key?: string) => void
    ) => void;
  }

  function multerS3(options: MulterS3Options): StorageEngine;

  export = multerS3;
}