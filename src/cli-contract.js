import { readFileSync } from 'node:fs';

import Ajv2020 from 'ajv/dist/2020.js';
import addFormats from 'ajv-formats';

export const CLI_OUTPUT_SCHEMA_VERSION = '1.0.0';
export const CLI_OUTPUT_SCHEMA_URL = 'https://dmarc4all.toppymicros.com/schemas/cli-output-1.0.0.schema.json';

const schema = JSON.parse(readFileSync(new URL('../schemas/cli-output-1.0.0.schema.json', import.meta.url), 'utf8'));
const ajv = new Ajv2020({ allErrors: true, strict: true, strictRequired: false, allowUnionTypes: true });
addFormats(ajv);
const validateSchema = ajv.compile(schema);

export function validateCliOutput(command, value) {
	const valid = validateSchema(value) && value.command === command;
	const errors = valid ? [] : [
		...(value && value.command !== command ? ['command does not match the requested operation'] : []),
		...(validateSchema.errors || []).map((error) => `${error.instancePath || '/'} ${error.message}`)
	];
	return { valid, errors };
}
