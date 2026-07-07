ehteshamalam@MELT220157 nemo3-api-geofence-svc % grep -n -C 8 "geofenceHdlr" index.js
49-const chClientI = new ClickHouseClient();
50-
51-const geofenceSvcI = new GeofenceSvc(pgPoolI, servicelogger, config);
52-const healthSvcI = new HealthSvc();
53-const reportSvcI = new ReportSvc(chClientI, pgPoolI, servicelogger, config);
54-
55-// 2. Handlers...
56-const healthHdlrI = new HealthHdlr(healthSvcI);
57:const geofenceHdlrI = new GeofenceHdlr(geofenceSvcI, servicelogger);
58-const reportHdlrI = new ReportHdlr(reportSvcI, servicelogger);
59-
60-// 3. Handler Map...
61-// Route prefix → handler instance mapping
62-const apiRoutes = [
63-  ["/api/v1/fms/geofence/health/", healthHdlrI],
64:  ["/api/v1/fms/geofence/", geofenceHdlrI],
65-  ["/api/v1/fms/geofence/report/", reportHdlrI],
66-];
67-
68-// 4. API Server...
69-// Express app wrapper with common middleware and error handling
70-const App = new APIServer(apiRoutes, servicelogger, config);
71-
72-
ehteshamalam@MELT220157 nemo3-api-geofence-svc % 
