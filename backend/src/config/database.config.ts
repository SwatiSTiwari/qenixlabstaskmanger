import { MongooseModuleOptions } from '@nestjs/mongoose';

export const getDatabaseConfig = (mongoUri: string): MongooseModuleOptions => ({
  uri: mongoUri,
});
