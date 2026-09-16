import { defineConfig } from 'drizzle-kit';

const databasePath = process.env.DATABASE_PATH ?? './data/gym.db';

export default defineConfig({
	schema: './src/lib/server/db/schema.ts',
	out: './src/lib/server/db/migrations',
	dialect: 'sqlite',
	dbCredentials: {
		url: databasePath
	}
});
