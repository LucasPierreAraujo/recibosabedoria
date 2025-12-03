export default function middleware(req) {
  const { pathname } = req.nextUrl;
  console.log("Middleware ativo em:", pathname);

  const token = req.cookies.get('auth-token')?.value;
  console.log("token", token);
  const isLogged = !!token;

  if (pathname.startsWith('/dashboard') && !isLogged) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    return Response.redirect(url);
  }
  console.log('carregou no fim do middleware');
  return;
}

export const config = {
  matcher: ['/dashboard/:path*'],  
};