import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), 'data', 'ahr999.json');
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json(
      { 
        value: 0,
        signal: 'accumulate',
        price: 0,
        avgPrice200d: 0,
        growthFactor: 0,
        lastUpdated: new Date().toISOString(),
        error: '数据暂不可用'
      },
      { status: 200 }
    );
  }
}
