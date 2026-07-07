ehteshamalam@MELT220157 nemo3-api-geofence-svc % grep -R -n -C 12 "TOKEN_REQUIRED" app --include="*.js"              
app/utils/tokenutil.js-1-// Express middleware to extract JWT from cookie header and attach claims to req
app/utils/tokenutil.js-2-import { GetUnVerifiedClaims } from './jwtutil.js';
app/utils/tokenutil.js-3-import { APIResponseUnauthorized } from './responseutil.js';
app/utils/tokenutil.js-4-
app/utils/tokenutil.js-5-export const AuthenticateAccountTokenFromCookie = (req, res, next) => {
app/utils/tokenutil.js-6-    try {
app/utils/tokenutil.js-7-        const cookie = req.headers['Cookie'] || req.headers['cookie'];
app/utils/tokenutil.js-8-        let token = req.headers['Cookie'] || req.headers['cookie'];
app/utils/tokenutil.js-9-        if (!token) {
app/utils/tokenutil.js:10:            APIResponseUnauthorized(req, res, 'TOKEN_REQUIRED', 'Token is required', 'Token is required');
app/utils/tokenutil.js-11-            return;
app/utils/tokenutil.js-12-        }
app/utils/tokenutil.js-13-
app/utils/tokenutil.js-14-        // handle multiple cookies
app/utils/tokenutil.js-15-        if (token.includes(';')) {
app/utils/tokenutil.js-16-            const cookies = token.split(';');
app/utils/tokenutil.js-17-            for (let eachcookie of cookies) {
app/utils/tokenutil.js-18-                eachcookie = eachcookie.trim();
app/utils/tokenutil.js-19-                if (eachcookie.startsWith('token=')) {
app/utils/tokenutil.js-20-                    token = eachcookie.substring(6);
app/utils/tokenutil.js-21-                    break;
app/utils/tokenutil.js-22-                }
ehteshamalam@MELT220157 nemo3-api-geofence-svc % 
