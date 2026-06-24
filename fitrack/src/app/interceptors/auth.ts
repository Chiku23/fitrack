import { HttpInterceptorFn } from '@angular/common/http';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const token = localStorage.getItem('fitrack_auth_token');

  // Clone the request and insert the Authorization header if the token exists
  if (token) {
    const cloneReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    return next(cloneReq);
  }

  return next(req);
};