import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

function unauthorizedResponse() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
      'Cache-Control': 'no-store',
    },
  });
}

export function middleware(request: NextRequest) {
  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!username || !password) {
    return NextResponse.next();
  }

  const authorization = request.headers.get('authorization');
  if (!authorization?.startsWith('Basic ')) {
    return unauthorizedResponse();
  }

  try {
    const encodedCredentials = authorization.slice(6);
    const decodedCredentials = atob(encodedCredentials);
    const separatorIndex = decodedCredentials.indexOf(':');

    if (separatorIndex === -1) {
      return unauthorizedResponse();
    }

    const providedUsername = decodedCredentials.slice(0, separatorIndex);
    const providedPassword = decodedCredentials.slice(separatorIndex + 1);

    if (providedUsername !== username || providedPassword !== password) {
      return unauthorizedResponse();
    }

    return NextResponse.next();
  } catch {
    return unauthorizedResponse();
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
