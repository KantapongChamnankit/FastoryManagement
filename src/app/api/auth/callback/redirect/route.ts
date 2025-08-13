import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
    // Get the callback URL from query parameters if provided
    const { searchParams } = new URL(request.url);
    const callbackUrl = searchParams.get('callbackUrl') || '/home/dashboard';
    //check error param
    const error = searchParams.get('error');``

    // Create login URL with callback parameter + error 
    const loginUrl = new URL('/login', request.url);
    
    // Add callbackUrl as a parameter if it exists
    if (callbackUrl && callbackUrl !== '/home/dashboard') {
        loginUrl.searchParams.set('callbackUrl', callbackUrl);
    }

    // Add error as a parameter if it exists
    if (error) {
        loginUrl.searchParams.set('error', error);
    }

    // Redirect to login page
    return NextResponse.redirect(loginUrl);
}

export async function POST(request: NextRequest) {
    // Handle POST requests the same way
    return GET(request);
}