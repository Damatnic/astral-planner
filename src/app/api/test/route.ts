import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    return NextResponse.json({
      success: true,
      message: 'Ultimate Digital Planner API is working!',
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      status: {
        nextjs: '15.5.4',
        typescript: 'active',
        api: 'operational'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'API Error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    return NextResponse.json({
      success: true,
      message: 'POST request successful',
      received: body,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json(
      { 
        success: false, 
        error: 'Invalid JSON or request error',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 400 }
    );
  }
}