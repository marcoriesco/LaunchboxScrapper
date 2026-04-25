import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'mapping.json');
        const fileContents = fs.readFileSync(filePath, 'utf8');
        return NextResponse.json(JSON.parse(fileContents));
    } catch (e) {
        return NextResponse.json({ error: 'Failed to read mapping.json' }, { status: 500 });
    }
}
