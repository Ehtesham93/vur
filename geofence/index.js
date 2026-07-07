

import { Router } from "express";
import controller from './controller';

const router = new Router();

module.exports  = (params) => {
    const {constant, postgresDB } = params;



	/**
     * @api {get} /driver/geofence List of geofence
     * @apiVersion 1.0.0
     * @apiName getGeofence
     * @apiGroup Geofence
     * @apiDescription Get list of all geofence based on vehicle
     *
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
	 *		[
	 *		    {
	 *		        "id": 21559,
	 *		        "vin": "MA1BB2ZB8PJD41113",
	 *		        "created_by": "bcf8636d-4ded-46d5-8b14-571c997902b4",
	 *		        "location": "GQMP%2BC87%2C%20Kozhikode%2C%20Kerala%20673614%2C%20India",
	 *		        "latitude": 11.533718489614412,
	 *		        "longitude": 75.78540030866861,
	 *		        "radius": 2031,
	 *		        "type": "exit",
	 *		        "category": "driver",
	 *		        "status": true,
	 *		        "name": "Geofence_26082024153509",
	 *		        "customer_segment": "personal_driver"
	 *		    }
	 *		]
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     *
     */

    router.get(['/:vin','/'], (req, res) => {
		const { vin } = req.ME.user;
		let category = req.query.category;
		let geofenceData = {
			vin: vin,
			category: category
		}
        controller.getDriverAppGeofence(geofenceData)
        .then((data) => res.status(200).json(data).end())
        .catch((err) => {
            res.status(400).json({message: err.message ? err.message : constant.message.OOPS}).end();
        })
	});

    /**
	 * @api {post} /driver/api/geo_fence Creating Geo Fence
	 * @apiVersion 1.0.0
	 * @apiName CreateGeoFence
	 * @apiGroup GeoFencing
	 * @apiDescription To create a geo fence
	 *
	 * @apiHeader {String} Content-Type type of the content, to be posted
	 * @apiHeader {String} Authorization Header defines the identity of the sender
	 *
	 * @apiHeaderExample {json} Header-Example:
	 *     {
	 *       "Content-Type": "application/json",
	 *       "Authorization": "Bearer ${ACCESSTOKEN}"
	 *     }
	 *
	 * @apiParam (Body) {String} name geofence name 
	 * @apiParam (Body) {String} location location 
	 * @apiParam (Body) {Number} latitude latitude  
	 * @apiParam (Body) {Number} longitude longitude
	 * @apiParam (Body) {Number} radius radius in meters
	 * @apiParam (Body) {String} type geofence type can be either enter or exit
	 * @apiParam (Body) {String} category category should be driver
	 * @apiParam (Body) {String} segment segment should be personal_driver
	 * @apiParam (Body) {String} status Boolean value
	 * 
	 * 
	 * 
	 * @apiParamExample {json} RequestBodyExample:
	 * 	
	 * 	{
	 *		"name": "Geofence_26082024153509",
	 *		"location": "GQMP%2BC87%2C%20Kozhikode%2C%20Kerala%20673614%2C%20India",
	 *		"latitude": "11.533718489614412",
	 *		"longitude": "75.78540030866861",
	 *		"type": "exit",
	 *		"radius": 2031,
	 *		"status": true,
	 *		"category": "driver",
	 *		"segment": "personal_driver"
	 *	}
	 *
	 *	
	 * @apiSuccessExample {json} Success-Response:
	 *   HTTP/1.1 200 OK
	 *	
	 *		{
	 *		    "id": 21560,
	 *		    "vin": "MA1BB2ZB8PJD41113",
	 *		    "created_by": "bcf8636d-4ded-46d5-8b14-571c997902b4",
	 *		    "location": "GQMP%2BC87%2C%20Kozhikode%2C%20Kerala%20673614%2C%20India",
	 *		    "latitude": 11.533718489614412,
	 *		    "longitude": 75.78540030866861,
	 *		    "radius": 2031,
	 *		    "type": "exit",
	 *		    "category": "driver",
	 *		    "status": true,
	 *		    "name": "Geofence_26082024153509",
	 *		    "customer_segment": "personal_driver"
	 *		}
	 * 
	 * 
	 *  @apiErrorExample {json} Error-Response:
	 *   HTTP/1.1 400 NotFullFilled
	 *     {
	 *		 "message": "Data is not Valid"
	 *	   } 
	 *
	 *  @apiErrorExample {json} Error-Response:
	 *   HTTP/1.1 400 BadRequest
	 *     {
	 *		 "message": "You have exceeded maximum allowed geofence limit!"
	 *	   } 
	 *
	 * @apiErrorExample {json} Error-Response:
	 *   HTTP/1.1 500 InternalServerError
	 *     {
	 *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
	 *     } 
	 *
	 */

    router.post('/', (req, res) => {
        const { customer, vin  } = req.ME.user;
        let { location, latitude, longitude, radius, type, category, segment, name } = req.body;
        if (!vin || !latitude || !longitude || !radius || !type || (type != 'enter' && type != 'exit') || !category) return res.status(400).json({ message: constant.message.INVALID_BODY });
        let geofenceObject = {
            vin: vin,
            name: name,
            created_by:customer,
            latitude: latitude,
            longitude: longitude,
            location: location,
            radius: radius,
            type: type,
            customer_segment: segment,
            category: category,
            created_at: new Date(),
            updated_at: new Date()
        };

        controller.createDriverAppGeofence(geofenceObject)
		.then((data) => {
			if(Object.hasOwn(data, 'error')) throw data;
			else res.status(200).json(data).end()
		})
        .catch((err) => {
			// console.log("Checking---------->>>Error",err);
            res.status(400).json({message: err.error ? err.error : constant.message.OOPS}).end();
        })
    });
    

	/**
     * @api {put} /driver/geofence/:id Update geofence 
     * @apiVersion 1.0.0
     * @apiName updateGeofence
     * @apiGroup Geofence
     * @apiDescription Update geofence details for given geofence id
	 * 
	 * 
	 * @apiParam (Body) {String} name geofence name 
	 * @apiParam (Body) {String} location location 
	 * @apiParam (Body) {Number} latitude latitude  
	 * @apiParam (Body) {Number} longitude longitude
	 * @apiParam (Body) {Number} radius radius in meters
	 * @apiParam (Body) {String} type geofence type can be either enter or exit
	 * @apiParam (Body) {String} category category should be driver
	 * @apiParam (Body) {String} customer_segment segment should be personal_driver
	 * @apiParam (Body) {String} status Boolean value
	 * 
	 * @apiParamExample {json} RequestBodyExample:
	 * 	
	 * 	{
     *    "location": "RHRJ+GH Apremont-la-Forêt, France",
     *    "latitude": 48.84131362653801,
     *    "longitude": 5.58137621730566,
     *    "radius": 1145,
     *    "type": "exit",
     *    "category": "driver",
     *    "status": false,
     *    "name": "Geofence_04042025161121",
     *    "customer_segment": "personal_driver"
	 *	}
	 *
     *
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
	 *		[
	 *		    {
	 *		        "id": 21559,
	 *		        "vin": "MA1BB2ZB8PJD41113",
	 *		        "created_by": "bcf8636d-4ded-46d5-8b14-571c997902b4",
	 *		        "location": "GQMP%2BC87%2C%20Kozhikode%2C%20Kerala%20673614%2C%20India",
	 *		        "latitude": 11.533718489614412,
	 *		        "longitude": 75.78540030866861,
	 *		        "radius": 2031,
	 *		        "type": "exit",
	 *		        "category": "driver",
	 *		        "status": true,
	 *		        "name": "Geofence_26082024153509",
	 *		        "customer_segment": "personal_driver"
	 *		    }
	 *		]
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     *
     */

    router.put('/:id', (req, res) => {
		let id = req.params.id;
		const { customer } = req.ME.user;
		if (!req.body) return res.status(400).json({ message: constant.message.INVALID_BODY });
        controller.editDriverAppGeofence(id, req.body, customer, postgresDB)
        .then((data) => res.status(200).json(data).end())
        .catch((err) => {
            res.status(400).json({message: err.message ? err.message : constant.message.OOPS}).end();
        })
	});

	/**
     * @api {delete} /driver/geofence/id Delete Geofence
     * @apiVersion 1.0.0
     * @apiName deleteGeofence
     * @apiGroup Geofence
     * @apiDescription Deleting the geofence for given geofence id
     *
     * @apiSuccessExample {json} Success-Response:
     *   HTTP/1.1 200 OK
     *
	 *		{
	 *			"message": "Geofence deleted successfully."
	 *		}
     *
     * @apiErrorExample {json} Error-Response:
     *   HTTP/1.1 500 InternalServerError
     *     {
     *       "message": "Something went wrong!, informed to tech team, will be resolved soon"
     *     } 
     * 
     *
     */


    router.delete('/:id', (req, res) => {
		let id = req.params.id;
		const { customer } = req.ME.user;
        controller.deleteDriverAppGeofence(id, customer, postgresDB)
        .then(() => res.status(200).json({message: "Geofence deleted successfully."}).end())
        .catch((err) => {
            res.status(400).json({message: err.message ? err.message : constant.message.OOPS}).end();
        })
	});


    return router;
}
