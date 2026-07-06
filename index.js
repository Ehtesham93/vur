import Promise from 'bluebird';

import express from 'express';

import userIdentityMiddleware from '../modules/user-identity';
import GuardMiddleware from '../modules/guard';


const guardMiddleware = new GuardMiddleware();
const requestPromise = require("request-promise");

import assistance from './assistance/index';
import vehicle from './vehicle/index';
import accountdetails from './account/index';
import liveLocation from './location/index';
import sos from './sos/index';
import device from './device/index';
import geofence from './geofence/index';
import insurance from './insurance/index';
import trip from './trip/index';
import chargeInsights from './charge-insights/index';
import ecoContribution from './eco-contribution/index';
import servicesDetails from './service/index';
import expense from './expense/index';
import banner from './banner/index';
import gamification from './gamification/index';
import testtoken from './test/index';
import devSupportController from './dev-support/index'

import crypto from 'crypto';

module.exports.init = function (app, db, extraParams) {
    const { postgresDB, logger, constant } = extraParams;

const validationCheckGuard = function (baseHref) {
    return function(req, res, next) {
        if(req.originalUrl.startsWith(`${baseHref}/vehicle/activate`) || req.originalUrl.includes(`${baseHref}/vehicle/list`)  || req.originalUrl.includes(`changeowner`)) next();
            else {
                if(req.ME.user.vin) next()
                else {
                    const token = getTokenFromHeaders(req.headers)
                    var options = {
                        method: 'POST',
                        uri: `${process.env.AUTH_OP_ME_URL}/authentication/op/me`,
                        headers: {
                            ...token,
                            "Content-Type":"application/x-www-form-urlencoded"
                        },json: true
                    };
                    return requestPromise(options)
                    .then((authDetails) => {
                        if(authDetails.vin) {
                            req.ME.user.vin = authDetails.vin
                            next();
                        }
                        // else if (req.originalUrl === `${baseHref}/driver/account`) next();
                        else if (req.originalUrl.startsWith(`${baseHref}/account?platform`)) next();
                        else res.status(400).json({ message : "UnAuthorized. Please login again."}).end();
                    })
                    .catch((err) => {
                        res.status(400).json({ message : "UnAuthorized. Please login again."}).end();
                    })
                }
            }
    }
}

const checkInvalidInputBody = function(req, res, next) {
    let regex = /^[A-Za-z0-9 ]+$/, insuranceRegex =  /^[a-zA-Z0-9]*$/, alphaNumerixRegex =  /^[A-Za-z0-9 _-]+$/, newRegex = /^[a-z]{2}$/, numberRegex = /^[0-9]+$/, numberDotRegex =  /^\d+(\.\d+)*$/, dateRegex = /^(0[1-9]|[12][0-9]|3[01])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$|^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\s+([01][0-9]|2[0-3]):([0-5][0-9])$/;
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
        if(key === 'language_code' && !(process.env.DRIVERAPP_LANGUAGES.includes(req.body[key])) && !newRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if((key === 'price' || key === 'longitude' || key === "latitude" || key === 'app_version') && !numberDotRegex.test(req.body[key])) return res.status(400).json({message :constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end(); // Good
        else if(key === 'vehicle_model' && !(process.env.DRIVER_APP_MODELS.includes(req.body[key])))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if (key === 'mobile' && !numberRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if ((key === 'expiry_at') && !dateRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if ((key === 'name' || key === 'segment' || key == 'created_by' || key === 'user_id' || key === 'customer_segment' || key === 'userId') && !alphaNumerixRegex.test(req.body[key])) return res.status(500).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if (( key === 'policyNo' ) && !insuranceRegex.test(req.body[key])) return res.status(500).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else {
              if( !(key === 'app_version' ||  key === 'policyNo'  || key === 'user_id' ||  key === 'customer_segment' || key === 'vehicle_model' || key === 'name' || key === 'price' || key === 'location' || key === 'segment' || key === 'policyNo' || key == 'created_by' || key === 'expiry_at' || key === 'token' || key === 'refresh_token' || key == 'longitude' || key =='latitude'  || key === 'userId' || key === 'email') && (!regex.test(req.body[key]))) return res.status(500).json({message : key + ' ' +constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        }
}
}
    for(const key in req.query) {
        if(key === 'lang' && (!process.env.DRIVERAPP_LANGUAGES.includes(req.query[key]) || req.ME.user.language_iso_code != req.query[key])) return res.status(401).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        if((key === 'platform' || key === 'os') && !(req.query[key] == 'android' || req.query[key] === 'ios'))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        if(key === 'model' && !(process.env.DRIVER_APP_MODELS.includes(req.query[key])))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        if((key === 'offset' || key === 'limit' || key === 'radius' || key === 'distance') && !numberRegex.test(req.query[key]))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        if( key === 'duration') {
              if(req.originalUrl.includes('feasibility') && !numberRegex.test(req.query[key]) ) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
              else if(req.originalUrl.includes('location') && !numberRegex.test(req.query[key])) return res.status(400).json({message :  constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
              else if(!req.originalUrl.includes('feasibility') && !req.originalUrl.includes('location') && !(req.query[key] == 'weekly' || req.query[key] === 'monthly') ) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
         }
        if((key === 'latitude' || key === 'longitude') && !numberDotRegex.test(req.query[key]))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        if(key === 'trip_type' && !(req.query[key] === 'oneway')) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
    }
    next();
}

const getTokenFromHeaders = function(reqHeaders) {
    if(reqHeaders.hasOwnProperty('authorization')) return { 'Authorization' : reqHeaders['authorization']}
    else if(reqHeaders.hasOwnProperty('x-user-id-token')) return { 'x-user-id-token' : reqHeaders['x-user-id-token']}
}

const validateIncomingRequest = function(req, res, next) {
    try {
        const ivCiphertext = Buffer.from(req.headers['x-authorization'], 'base64url');
        const iv = ivCiphertext.subarray(0, 16);
        const ciphertext = ivCiphertext.subarray(16);
        const cipher = crypto.createDecipheriv('aes-256-cbc',process.env.DRIVERAPP_SECRET_KEY, iv);
        let decrypted = Buffer.concat([cipher.update(ciphertext), cipher.final()]);
        req.headers['authorization'] = decrypted.toString('utf-8');;
        next();
    } catch(err) {
        res.status(401).json({ message : "UnAuthorized."}).end();
    }
}



const devSupportMiddleware = function(req, res, next) {
    const { role } = req.ME.user;
    let roles = process.env.DEV_SUPPORT_ROLES || "dev-support";
    roles = roles.split(",");
 
    if(roles.indexOf(role) == -1) return res.status(403).send("Access Denied");
    next();
}

    let baseHref = '/driver'

    app.use(`${baseHref}/assistance`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], assistance(extraParams));
    app.use(`${baseHref}/vehicle`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], vehicle(extraParams));
    app.use(`${baseHref}/account`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], accountdetails(extraParams));
    app.use(`${baseHref}/location`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], liveLocation(extraParams));
    app.use(`${baseHref}/sos`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], sos(extraParams));
    app.use(`${baseHref}/devices`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], device(extraParams));
    app.use(`${baseHref}/geofence`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], geofence(extraParams));
    app.use(`${baseHref}/insurance`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], insurance(extraParams));
    app.use(`${baseHref}/trip`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], trip(extraParams));
    app.use(`${baseHref}/charge-insights`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], chargeInsights(extraParams));
    app.use(`${baseHref}/eco-contribution`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], ecoContribution(extraParams));
    app.use(`${baseHref}/operations`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], servicesDetails(extraParams));
    app.use(`${baseHref}/expense`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], expense(extraParams));
    app.use(`${baseHref}/banner`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], banner(extraParams));
    app.use(`${baseHref}/gamification`,[userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody], gamification(extraParams));
    app.use(`${baseHref}/authentication`,[validateIncomingRequest], accountdetails(extraParams));
    app.use(`${baseHref}/testtoken`,[userIdentityMiddleware, guardMiddleware , validationCheckGuard], testtoken(extraParams));
    app.use(`${baseHref}/download/appList`, [userIdentityMiddleware, devSupportMiddleware], devSupportController(extraParams));


    return Promise.resolve();

}
