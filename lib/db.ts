import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Export prisma for direct usage elsewhere
export { prisma };

// Lightweight SQL helper that routes SELECT vs non-SELECT appropriately
export async function query<T = unknown>(text: string, params: unknown[] = []): Promise<{ rows: T[] }> {
	const sql = String(text || "").trim();
	const isSelect = /^select\s/i.test(sql);
	try {
		if (isSelect) {
			const res = await prisma.$queryRawUnsafe<T[]>(sql, ...(params as any[]));
			return { rows: (res ?? []) as T[] };
		}
		// For INSERT/UPDATE/DELETE use execute to avoid result casting issues
		await prisma.$executeRawUnsafe(sql, ...(params as any[]));
		return { rows: [] as T[] };
	} catch (err: any) {
		// Only show the relations guidance for clear undefined-table cases
		const msg: string = String(err?.message || "");
		const pgCode: string | undefined = (err?.code || err?.meta?.code || err?.original?.code);
		const missingTable = /relation\s+"?.+?"?\s+does\s+not\s+exist/i.test(msg) || pgCode === "42P01";
		if (missingTable) {
			throw new Error(
				"Database relations (tables) not found. Ensure prisma/schema.prisma defines your models, then run: `npx prisma generate` and `npx prisma db push` (and ensure DATABASE_URL is set).\nOriginal error: " + msg
			);
		}
		throw err;
	}
}


