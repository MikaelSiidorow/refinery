import type { UuidV7 } from '$lib/utils';
import { z } from 'zod';

export const zUuidV7 = () => z.uuidv7().transform((val): UuidV7 => val as UuidV7);
