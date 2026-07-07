ehteshamalam@MELT220157 nemo3-api-geofence-svc % grep -R -n -C 15 "AuthenticateAccountFromCookies" app --include="*.js"
ehteshamalam@MELT220157 nemo3-api-geofence-svc % grep -R -n -C 15 "AuthenticateAccountTokenFromCookies" app --include="*.js"
ehteshamalam@MELT220157 nemo3-api-geofence-svc % clear
ehteshamalam@MELT220157 nemo3-api-geofence-svc % grep -R -n -C 15 "AuthenticateAccountTokenFromCookie" app --include="*.js" 
app/utils/tokenutil.js-1-// Express middleware to extract JWT from cookie header and attach claims to req
app/utils/tokenutil.js-2-import { GetUnVerifiedClaims } from './jwtutil.js';
app/utils/tokenutil.js-3-import { APIResponseUnauthorized } from './responseutil.js';
app/utils/tokenutil.js-4-
app/utils/tokenutil.js:5:export const AuthenticateAccountTokenFromCookie = (req, res, next) => {
app/utils/tokenutil.js-6-    try {
app/utils/tokenutil.js-7-        const cookie = req.headers['Cookie'] || req.headers['cookie'];
app/utils/tokenutil.js-8-        let token = req.headers['Cookie'] || req.headers['cookie'];
app/utils/tokenutil.js-9-        if (!token) {
app/utils/tokenutil.js-10-            APIResponseUnauthorized(req, res, 'TOKEN_REQUIRED', 'Token is required', 'Token is required');
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
--
app/handlers/reporthdlr/reporthdlr.js-1-// Report HTTP handler: validates inputs and delegates to reporting logic.
app/handlers/reporthdlr/reporthdlr.js-2-import { z } from 'zod';
app/handlers/reporthdlr/reporthdlr.js-3-import { APIResponseInternalErr, APIResponseOK, APIResponseBadRequest } from '../../utils/responseutil.js';
app/handlers/reporthdlr/reporthdlr.js-4-import ReportHdlrImpl from './reporthdlr_impl.js';
app/handlers/reporthdlr/reporthdlr.js:5:import { AuthenticateAccountTokenFromCookie } from '../../utils/tokenutil.js';
app/handlers/reporthdlr/reporthdlr.js-6-import { ErrCodeToObj, GetMyGeofencePermissions } from '../../utils/utils.js';
app/handlers/reporthdlr/reporthdlr.js-7-
app/handlers/reporthdlr/reporthdlr.js-8-export default class ReportHdlr {
app/handlers/reporthdlr/reporthdlr.js-9-    constructor(reportSvcI, logger) {
app/handlers/reporthdlr/reporthdlr.js-10-        this.reportHdlrImpl = new ReportHdlrImpl(reportSvcI, logger);
app/handlers/reporthdlr/reporthdlr.js-11-        this.logger = logger;
app/handlers/reporthdlr/reporthdlr.js-12-    }
app/handlers/reporthdlr/reporthdlr.js-13-
app/handlers/reporthdlr/reporthdlr.js-14-    RegisterRoutes(router) {
app/handlers/reporthdlr/reporthdlr.js-15-        // All report endpoints require auth and permissions
app/handlers/reporthdlr/reporthdlr.js:16:        router.use(AuthenticateAccountTokenFromCookie);
app/handlers/reporthdlr/reporthdlr.js-17-        router.use(GetMyGeofencePermissions);
app/handlers/reporthdlr/reporthdlr.js-18-        router.post('/alert', this.getGeoAlertReport);
app/handlers/reporthdlr/reporthdlr.js-19-        router.post('/trip', this.getGeoTripReport);
app/handlers/reporthdlr/reporthdlr.js-20-    }
app/handlers/reporthdlr/reporthdlr.js-21-
app/handlers/reporthdlr/reporthdlr.js-22-    getGeoAlertReport = async (req, res, next) => {
app/handlers/reporthdlr/reporthdlr.js-23-        try {
app/handlers/reporthdlr/reporthdlr.js-24-            const geoAlertReportSchema = z.object({
app/handlers/reporthdlr/reporthdlr.js-25-                fleetid: z.uuid(),
app/handlers/reporthdlr/reporthdlr.js-26-                ruleids: z.array(z.uuid()).optional(),
app/handlers/reporthdlr/reporthdlr.js-27-                vinnos: z.array(z.string().min(17).max(17)).optional(),
app/handlers/reporthdlr/reporthdlr.js-28-                starttime: z.number(),
app/handlers/reporthdlr/reporthdlr.js-29-                endtime: z.number(),
app/handlers/reporthdlr/reporthdlr.js-30-            });
app/handlers/reporthdlr/reporthdlr.js-31-            const accountid = req.accountid;
--
app/handlers/geofencehdlr/geofencehdlr.js-1-// Geofence HTTP handler: validates inputs (zod), enforces auth via middlewares,
app/handlers/geofencehdlr/geofencehdlr.js-2-// delegates to implementation logic, and normalizes API responses.
app/handlers/geofencehdlr/geofencehdlr.js-3-import { z } from 'zod';
app/handlers/geofencehdlr/geofencehdlr.js-4-import { APIResponseInternalErr, APIResponseOK, APIResponseBadRequest } from '../../utils/responseutil.js';
app/handlers/geofencehdlr/geofencehdlr.js-5-import GeofenceHdlrImpl from './geofencehdlr_impl.js';
app/handlers/geofencehdlr/geofencehdlr.js:6:import { AuthenticateAccountTokenFromCookie } from '../../utils/tokenutil.js';
app/handlers/geofencehdlr/geofencehdlr.js-7-import { ErrCodeToObj, GetMyGeofencePermissions } from '../../utils/utils.js';
app/handlers/geofencehdlr/geofencehdlr.js-8-
app/handlers/geofencehdlr/geofencehdlr.js-9-export default class GeofenceHdlr {
app/handlers/geofencehdlr/geofencehdlr.js-10-    constructor(geofenceSvcI, logger) {
app/handlers/geofencehdlr/geofencehdlr.js-11-        this.geofenceHdlrImpl = new GeofenceHdlrImpl(geofenceSvcI, logger);
app/handlers/geofencehdlr/geofencehdlr.js-12-        this.logger = logger;
app/handlers/geofencehdlr/geofencehdlr.js-13-    }
app/handlers/geofencehdlr/geofencehdlr.js-14-
app/handlers/geofencehdlr/geofencehdlr.js-15-    RegisterRoutes(router) {
app/handlers/geofencehdlr/geofencehdlr.js-16-        // Public helper to seed token for Swagger/clients; rest require auth + permissions
app/handlers/geofencehdlr/geofencehdlr.js-17-        router.post('/settoken', this.setToken);
app/handlers/geofencehdlr/geofencehdlr.js:18:        router.use(AuthenticateAccountTokenFromCookie);
app/handlers/geofencehdlr/geofencehdlr.js-19-        router.use(GetMyGeofencePermissions);
app/handlers/geofencehdlr/geofencehdlr.js-20-        // Geofence CRUD
app/handlers/geofencehdlr/geofencehdlr.js-21-        router.post('/create', this.CreateGeofence);
app/handlers/geofencehdlr/geofencehdlr.js-22-        router.post('/create/withrule', this.CreateGeofenceWithRule);
app/handlers/geofencehdlr/geofencehdlr.js-23-        router.get('/list/withrule', this.GetGeofencesWithActionInfo);
app/handlers/geofencehdlr/geofencehdlr.js-24-        router.get('/list', this.GetGeofence);
app/handlers/geofencehdlr/geofencehdlr.js-25-        router.get('/list/:geofenceid', this.GetGeofenceById);
app/handlers/geofencehdlr/geofencehdlr.js-26-        router.put('/update', this.UpdateGeofence);
app/handlers/geofencehdlr/geofencehdlr.js-27-        router.put('/updateactive/withrule', this.UpdateGeofenceStateWithRule);
app/handlers/geofencehdlr/geofencehdlr.js-28-        router.put('/updateactive', this.UpdateGeofenceState);
app/handlers/geofencehdlr/geofencehdlr.js-29-        router.delete('/delete/withrule', this.DeleteGeofenceWithRule);
app/handlers/geofencehdlr/geofencehdlr.js-30-        router.delete('/delete', this.DeleteGeofence);
app/handlers/geofencehdlr/geofencehdlr.js-31-        router.get('/listgeorules', this.ListGeoRules);
app/handlers/geofencehdlr/geofencehdlr.js-32-
app/handlers/geofencehdlr/geofencehdlr.js-33-        // Rule taxonomy and assignment
ehteshamalam@MELT220157 nemo3-api-geofence-svc % 
