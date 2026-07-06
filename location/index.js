import { Router } from "express";
import controller from './controller';

const router = new Router();
const requestPromise = require("request-promise");
module.exports  = (params) => {
    const {constant, postgresDB, secretManager } = params;
        /**
     * @api {get} /driver/location/vehicle Get Live Location 
     * @apiVersion 1.0.0
     * @apiName GetLiveLocation
     * @apiGroup LiveLocation
     * @apiDescription Get Live Location of vehicle
     *
     *	
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
     *     {
     *       "vin": "MB7D8RF3BJJG21617",
     *       "latitude": 19.2734066666667,
     *       "longitude": 73.04477,
     *       "last_connected": "2023-12-20T08:44:50.033Z"
     *     }
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     *
     */

     router.get(['/vehicle/:vin', '/vehicle'], (req, res) => {
        let vin = req.ME.user.vin
         controller.getVehicleLiveLocation(vin, postgresDB)
         .then((liveLocationDetails) => res.status(200).json(liveLocationDetails).end())
         .catch((err) => { 
            console.log("Get live location url",err);
            res.status(500).json({message: constant.message.OOPS })
          })
    })

    /**
     * @api {get} /driver/location/routes Generating Google Routes details
     * @apiVersion 1.0.0
     * @apiName GoogleRoutesDetails
     * @apiGroup LiveLocation
     * @apiDescription Generate google routes details
     *
     * @apiparam (BodyParameter) {String} src_longitude Source Longitude      
     * @apiparam (BodyParameter) {String} src_latitude Source Latitude
     * @apiparam (BodyParameter) {String} dest_latitude Destination Latitude
     * @apiparam (BodyParameter) {String} dest_longitude Destination Longitude
     *	
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
     *  {
     *      "routes": {
     *          "geocoded_waypoints": [
     *                  {
     *                  "geocoder_status": "OK",
     *                  "place_id": "ChIJ____IPs9rjsRNZwiUZB3z0Q"
     *                  },
     *                  {
     *                  "geocoder_status": "OK",
     *                  "place_id": "ChIJEZ7VCdAXrjsRLKkeVQXVJ6M"
     *                  }
     *              ],
     *              "routes": [
     *                  {
     *                  "copyrights": "Powered by Google, ©2025 Google",
     *                  "overview_polyline": {
     *                      "points": "qydnAexixMO`@U^Y^u@q@wAmAg@d@yBsCEE}@QuA[gNiCkGwAs@OMEICEWQcDs@}I_@oDKu@g@qBY_As@}B{@aDIMWIgACsFO_@ED[Ng@v@sAXc@JCBWTiAJyBJyCLyBb@yEHsADIJaA`@}CAYEc@aAmEs@qCIWCk@EaAHk@Ha@Na@^k@VUTSNSJSPMf@S~@a@ZM\\EbACXI`@Y`As@?CDILIN@JJ@JAFt@HvLTn@?x@E`@MlBCRsEBoAM["
     *                  },
     *                  "summary": "80 Feet Rd/Dr Rajkumar Rd",
     *                  "warnings": [],
     *                  "waypoint_order": []
     *                  }
     *              ],
     *              "status": "OK"
     *      }
     * }
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 400 InternalServerError
     *     {
     *       "message": "Please provide valid paramters."
     *     } 
     * 
     */


    router.get('/routes',async (req, res) => {
        const { src_longitude, src_latitude, dest_latitude, dest_longitude} = req.query;
        if(src_longitude && src_latitude && dest_latitude && dest_longitude) {
        const { APP_GOOGLE_API_KEY } = await secretManager.getSecretValue(process.env.AWS_PROGRAMMATIC_SECRET_NAME);
        var options = {
            method: 'GET',
            uri: `https://maps.googleapis.com/maps/api/directions/json?origin=${src_latitude},${src_longitude}&destination=${dest_latitude},${dest_longitude}&sensor=true&mode=driving&key=${APP_GOOGLE_API_KEY}`,
            json: true
        };
        return requestPromise(options)
        .then((routesDetails) => {
            res.status(200).json(routesDetails).end();
        })
        .catch((err) => { 
            console.log("Failed to fetch routes",err);
            res.status(500).json({message: constant.message.OOPS })
        })
        }else res.status(400).json({ message: "Please provide valid parameters."});

    })

    /**
     * @api {get} /driver/location/:vin Creating a live location url (New)
     * @apiVersion 1.0.0
     * @apiName CreateLiveLocationNew
     * @apiGroup LiveLocation
     * @apiDescription To create a live location url
     *
     * @apiParam (URL) {String} vin VIN
     * @apiParam (Query) {Integer} duration duration in minutes
     *	
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
     *  {
     *      "url": "<DOMAIN_NAME>/stage/live_location?context=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IkpvaG4gRG9lIiwiaWF0IjoxNTE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c"
     *  }
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 400 NotFullFilled
     *     {
     *        message : "Please provide valid duration in minutes !"
     *     } 
     *
     */
    
     router.get(['/:vin','/'], (req, res) => {
        let vin = req.ME.user.vin;
        let { duration } = req.query;

        if(duration){
            controller.getLiveLocation(vin, duration, postgresDB, secretManager)
            .then((liveLocationURL) => res.status(200).json({ url: liveLocationURL}).end())
            .catch((err) => {
                if(err.message) res.status(400).json({message: err.message})
                else res.status(500).json({message: constant.message.OOPS });
            })
        }else res.status(400).json({ message: "Please provide valid duration in minutes !"});

    });


    return router;
}
