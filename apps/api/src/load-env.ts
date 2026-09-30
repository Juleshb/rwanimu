import { existsSync } from 'fs';
import { config } from 'dotenv';
import { resolve } from 'path';

const envPath = [
  resolve(process.cwd(), '../../.env'),
  resolve(process.cwd(), '.env'),
  resolve(__dirname, '../../../.env'),
  resolve(__dirname, '../../.env'),
].find((path) => existsSync(path));

if (envPath) config({ path: envPath });
