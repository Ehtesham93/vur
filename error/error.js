ehteshamalam@MELT220157 nemo3-api-geofence-svc % curl -i "http://localhost:10069/api/v1/fms/geofence/list?vin=MA1FZ2K5FH6J33183&category=driver"
HTTP/1.1 401 Unauthorized
X-Powered-By: Express
Vary: Origin, Accept-Encoding
Access-Control-Allow-Credentials: true
Content-Type: application/json; charset=utf-8
Content-Length: 104
ETag: W/"68-VHJerzmJxhcbOIzO1qH6KMRydlE"
Date: Tue, 07 Jul 2026 08:48:43 GMT
Connection: keep-alive
Keep-Alive: timeout=5

{"err":{"errcode":"TOKEN_REQUIRED","errdata":"Token is required"},"data":null,"msg":"Token is required"}%                                     
ehteshamalam@MELT220157 nemo3-api-geofence-svc % 
