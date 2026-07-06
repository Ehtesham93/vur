import { Router } from "express";
import controller from './controller';

const router = new Router();

module.exports  = (params) => {
    const {constant, postgresDB, serviceClient, clickhouseDB} = params;


/**
 * @api {get} /driver/vehicle/list Request To Fetch Vehicle List
 * @apiName VehicleList
 * @apiGroup vehicleGroup
 * 
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *      "Authorization": "Bearer ${ACCESSTOKEN}",
 *      "Content-Type":"application/json"
 *     }
 * 
 * 
 * @apiSuccessExample {json} Success-Response:
 *       HTTP/1.1 200 OK
 *     [    {
 *       "vin": "MB7U8CLLFNJC31293",
 *       "model": "Treo2.0",
 *       "license_plate": "NJC31293",
 *       "vehicle_variant": "SFT",
 *       "color": "blue",
 *       "vehicle_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/Zor/Zor-blue.png"
 *   }
 * ]
 * @apiSuccess {String} vin VIN
 * @apiSuccess {String} model  Vehicle model name
 * @apiSuccess {String} license_plate  Vehicle license plate number
 * @apiSuccess {String} vehicle_variant  Vehicle variant 
 * @apiSuccess {String} color  Vehicle color
 */

    router.get(['/list/:customerId','/list'], (req, res) => {
        const { customer } = req.ME.user;
        return controller.fetchVehicleDetails(customer, postgresDB)
        .then((vehicleDetails) => res.status(200).json(vehicleDetails).end())
        .catch((err) => { 
            res.status(400).json({message: constant.message.FAILED_FETCH_VEHICLEDETAILS_MSG}).end() 
        })
    })

/**
 * @api {put} /driver/vehicle/activate/ Request To Activate a vehicle
 * @apiName ActivateVehicle
 * @apiGroup vehicleGroup
 * 
 * @apiBody {String} vin  VIN
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *      "Authorization": "Bearer ${ACCESSTOKEN}",
 *      "Content-Type":"application/json"
 *     }
 * 
 * 
 * @apiSuccessExample {json} Success-Response:
 *       HTTP/1.1 200 OK
 * {
 * "msg": "User registered successfully."
 * }
 * 
 * @apiErrorExample {json} Error-Response:
 *     HTTP/1.1 500 
 *     {
 *       "msg": "Something went wrong! Please informed to tech team."
 *     }
 */

    router.put('/activate', (req, res) => {
        const { user_id, customer } = req.ME.user;
        let accountDetailsObject = {
            user_id: user_id,
            vin: req.body.vin,
            is_active: true,
            platform: req.body.platform
        }
        return controller.activateVehicle(accountDetailsObject, customer, postgresDB, serviceClient)
        .then(() => { res.status(200).json({ message: "User successfully resgistered."}).end(); })
        // .catch((err) => { res.status(400).json({ message: "Something went wrong! Please informed to tech team."}).end(); });
        .catch ((err) => res.status(err.status || 500).json({ message: err.message || constant.message.OOPS }).end());

    })

    /**
     * @api {get} /driver/vehicle/status Request To get vehicle status
     * @apiName VehicleStatus
     * @apiGroup vehicleGroup
     * 
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer ${ACCESSTOKEN}",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *  {
     *      "vin": "MB7U8CLLTKJA30021",
     *      "vehicle_model": "Treo",
     *      "license_plate": "MP09RA7085",
     *      "color": "coral-blue",
     *      "soc": 72,
     *      "dte": 102,
     *      "last_connected": "2021-07-20T07:20:53.710Z",
     *      "odometer": 4806,
     *      "vehicle_state": "IDLE",
     *      "vehicle_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/Treo/Treo-coral-blue.png",
     *      "purchase_date": null,
     *      "warranty": null,
     *      "extended_warranty": null,
     *      "last_service_on": null
     *  }
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "msg": "Something went wrong! Please informed to tech team."
     *     }
     */

    router.get(['/status/:vin','/status'], (req, res) => {
        const { vin } = req.ME.user;
        controller.getVehicleStatus(vin, postgresDB, constant)
        .then((dailyKms) => res.status(200).json(dailyKms).end())
        .catch ((err) => res.status(err.status || 500).json({ message: err.message || constant.message.OOPS }).end());
    })

    /**
     * @api {get} /driver/vehicle/dailykm Request To get vehicle daily km
     * @apiName VehicleDailyKm
     * @apiGroup vehicleGroup
     * 
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer ${ACCESSTOKEN}",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *  {
     *      "daily_kms": "50",
     *  }
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "msg": "Something went wrong! Please informed to tech team."
     *     }
     */
    router.get(['/dailykm/:vin','/dailykm'], (req, res) => {
        let { vin } = req.ME.user || req.params; 
        return controller.getDailyKm(vin, postgresDB, clickhouseDB)
        .then((dailyKms) => res.status(200).json({ daily_kms : dailyKms}).end())
        .catch ((err) => res.status(err.status || 500).json({ message: err.message || constant.message.OOPS }).end());
    })



    router.get(['/:vin/changeowner','/changeowner'], (req, res) => {
        let { vin } = req.params; 
        controller.resetChangeOwnership(vin, postgresDB)
        .then(() => res.status(200).json({ message : "Change ownership reset done successfully."}))
        .catch ((err) => {
            console.log("========>>>ChangeOwner",err);
            res.status(500).json({ message: constant.message.OOPS }).end();
        })
    })


        /**
     * @api {get} /driver/vehicle/service Vehicle Service History 
     * @apiName VehicleDetails
     * @apiGroup VehicleGroup
     * 
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer ${ACCESSTOKEN}",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *  [
     *      {
     *          "servicetype": "RUNNING REPAIR",
     *          "address": "PLOT AT KH NO. 419/3 G/F  VILLAGE  MUNDKA  NEW DELHI",
     *          "km": 14374,
     *          "totalamount": 0,
     *          "dealername": "INDRAPRASTHA MOTORS PVT. LTD.",
     *          "last_serviced_date": "2022-05-31"
     *      },
     *      {
     *          "servicetype": "RUNNING REPAIR",
     *          "address": "PLOT AT KH NO. 419/3 G/F  VILLAGE  MUNDKA  NEW DELHI",
     *          "km": 14380,
     *          "totalamount": 0,
     *          "dealername": "INDRAPRASTHA MOTORS PVT. LTD.",
     *          "last_serviced_date": "2022-05-31"
     *      },
     *      {
     *          "servicetype": "PAID SERVICE",
     *          "address": "PLOT AT KH NO. 419/3 G/F  VILLAGE  MUNDKA  NEW DELHI",
     *          "km": 22591,
     *          "totalamount": 3635.21,
     *          "dealername": "INDRAPRASTHA MOTORS PVT. LTD.",
     *          "last_serviced_date": "2023-06-27"
     *      },
     *  ]
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "msg": "Something went wrong! Please informed to tech team."
     *     }
     */
    router.get(['/service/:vin','/service'], (req, res) => {
        let { vin } = req.ME.user; 
        let {limit, offset } = req.query;
        controller.getVehicleServiceHistory(vin, limit, offset, postgresDB, constant.service_history)
        .then((serviceDetails) => res.status(200).json(serviceDetails).end())
        .catch ((err) => {
            res.status(500).json({ message: constant.message.OOPS }).end();
        })
    })


    /**
     * @api {get} /driver/vehicle/warnings Get Warnings Symbol 
     * @apiName WarningsSymbol
     * @apiGroup VehicleGroup
     * 
     * 
     * @apiparam (BodyParameter) {String} model Vehicle Model
     * @apiparam (BodyParameter) {String} language_code Language Code
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer ${ACCESSTOKEN}",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *     {
     *         "count": 1,
     *         "rows": [
     *             {
     *                 "open_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/BannersImage/KilometersBanner.png",
     *                 "close_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/BannersImage/TreoBanner.png",
     *                 "image_title": "ಲಿಂಪ್ ಹೋಮ್",
     *                 "image_description": "If the lamp status is ON: Indicates that the vehicle is low on SOC \\n Note: It is advisable to look out for charging station",
     *                 "bold_text": "ON",
     *                 "is_active": true,
     *                 "color_text": [{
     *                         "text": "Note",
     *                         "color": "#FF3B30"
     *                     },{
     *                         "text": "Text",
     *                         "color": "#23123"
     *                     }]
     *             }
     *         ]
     *     }
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "message": "Something went wrong! Please informed to tech team."
     *     }
     */

    router.get('/warnings', (req, res) => {
        let { model, language_code, platform } = req.query; 
        controller.getWarningSymbols(model, language_code, platform, postgresDB)
        .then((warningSymbolData) => res.status(200).json(warningSymbolData).end())
        .catch ((err) => {
            res.status(500).json({ message: constant.message.OOPS }).end();
        })
    })


    /**
     * @api {get} /driver/vehicle Vehicle Details 
     * @apiName VehicleDetails
     * @apiGroup VehicleGroup
     * 
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer ${ACCESSTOKEN}",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *      {
     *          "vin": "MA1FL2DDUP3B16018",
     *          "license_plate": "KA0220040005519",
     *          "color": null,
     *          "tgu_id": null,
     *          "tgu_model": "GEN2.1",
     *          "vehicle_model": "ZEO",
     *          "soc": 50,
     *          "dte": 20,
     *          "last_connected": "2024-09-17T01:30:19.860Z",
     *          "odometer": 34567.5,
     *          "ttc": "1H 45M",
     *          "vehicle_state": "DISCONNECTED",
     *          "is_feature_charge_scheduler": true,
     *          "is_feature_drive_badge": false,
     *          "is_feature_charge_badge": true,
     *          "is_feature_maintainance_badge": false,
     *          "vehicle_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/ZEO/default.png",
     *          "daily_kms_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/ZEO/ZEO_dashboard.png",
     *          "vehicle_detail_image": "https://stg-nemo-life.s3.ap-south-1.amazonaws.com/ZEO/default-details.png",
     *          "vehicle_type": "4W"
     *      }
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "msg": "Something went wrong! Please informed to tech team."
     *     }
     */
    router.get(['/:vin','/'], (req, res) => {
        let { vin } = req.ME.user;
        controller.getVehicleDetails(vin, postgresDB)
        .then((vehicleDetails) => res.status(200).json(vehicleDetails).end())
        .catch ((err) => {
            res.status(500).json({ message: constant.message.OOPS }).end();
        })
    })

    /**
     * @api {get} /driver/vehicle/widget Widget details
     * @apiName WidgetDetails
     * @apiGroup vehicleGroup
     * 
     * @apiparam (URLParameter) {String} vin VIN to get vehicle daily km
     * 
     * @apiHeaderExample {json} Header-Example:
     *   {
     *      "Authorization": "Bearer <access_token>",
     *      "Content-Type":"application/json"
     *   }
     * 
     * 
     * @apiSuccessExample {json} Success-Response:
     *       HTTP/1.1 200 OK
     *      {
     *          "daily_kms": 0,
     *          "range": 150,
     *          "vin": "MB7U8CLLTKJK30453",
     *          "soc": 99,
     *          "dte": 129,
     *          "last_connected": "2021-07-20T07:21:27.756Z",
     *          "vehicle_state": "DISCONNECTED"
     *      }
     * 
     * @apiErrorExample {json} Error-Response:
     *     HTTP/1.1 500 
     *     {
     *       "msg": "Something went wrong! Please informed to tech team."
     *     }
     */

    router.get('/widget/:modelName', (req, res) => {
        let { vin } = req.ME.user; 
        let modelName = req.params.modelName; 
        return controller.getWidgetDetails(vin, modelName,  postgresDB, constant, clickhouseDB)
        .then((widgetResponse) => res.status(200).json(widgetResponse).end())
        .catch ((err) => res.status(err.status || 500).json({ message: err.message || constant.message.OOPS }).end());
    })


    return router;

}
