import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test a simple query
    const count = await prisma.file.count();
    
    return NextResponse.json({
      database_connected: true,
      message: `Database connected successfully. Files in database: ${count}`
    });
  } catch (error) {
    console.error('Database health check failed:', error);
    return NextResponse.json({
      database_connected: false,
      error: error instanceof Error ? error.message : 'Unknown database error'
    });
  } finally {
    await prisma.$disconnect();
  }
} 