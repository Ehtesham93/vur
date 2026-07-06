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
import earnings from './earnings/index';

import crypto from 'crypto';

module.exports.init = function (app, db, extraParams) {
    const { postgresDB, logger, constant } = extraParams;

/**
 * @api {post} /authentication/op/token Request To Fetch OTP 
 * @apiName getOTP
 * @apiGroup authGroup
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *      "Authorization": "Basic <SECRET_KEY>",
 *      "Content-Type":"application/x-www-form-urlencoded"
 *     }
 * 
 * @apiBody {String} grant_type Mandtory Grant Type "retail_driver_signup_mobile"
 * @apiBody {String} mobile Mandtory mobile number
 * 
 * @apiSuccessExample {json} Success-Response:
 *       HTTP/1.1 200 OK
 * {
 *     "access_token": "ZDBiYzAwYzktODFjYi00ZDEwLTkyOWItYTZhYWM2Zjk5MjkymmZQcgfTzVrHRZ_2pcAHAXGdR9ZQKXbQzJOp2CvEk2FRpYE1BXi24v0slkZdwzV-D42fl7ZVYaGyuLHz6-fOng",
 *     "expires_in": 3600,
 *     "token_type": "Bearer",
 *     "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNpZy1ycy0wIn0.eyJzdWIiOiIzOGZmOTg3YTM4NTA2OTIyZTk1OTQ2ZmVkZjFjNGJmZDA2YWExNDU1MDkwODc5NDYzMzNkM2E3MWE0YTU2OTA0IiwibW9iaWxlIjoiODEyMzM4NDEwMSIsImF0X2hhc2giOiJxS1c0V2VNNl82UU5lemExdEE0aVN3Iiwic2lkIjoiNDViOWY3MjAtN2UyMS00MTNmLWI4MzktZDg3Y2Y2N2IwM2EwIiwiYXVkIjoiWk9SX0RFTU9fQ0xJRU5UIiwiZXhwIjoxNjkyNjg4NjI4LCJpYXQiOjE2OTI2ODUwMjgsImlzcyI6Imh0dHBzOi8vc3RnLW5lbW8ubWFoaW5kcmFlbGVjdHJpYy5jb20ifQ.YPUVTZ-IkbdA2gDshPF247QQFdNxMAN8Piw364Qrq-KzPp8xrCS2SkNZgfFA4E-7EoDWTTLXJcRVThg4My4AAPz6qPCpsoIC0l2oeozdJZcx6_GGUiBbzNcbuMq-uNe8CeAt6GLLj8y1tybWK_Dn6i9qOU0pK7YRgOwco20LWEDXql0PuS9t1IEg8hLl_xDPe6b_3wAjkxzaokmq6dHLkEasV35QJUDXVQD5NMnKM_ImmL_KHncLiMc6O6Hl_3C7lFH9qvpJSCWZSWktJ3Si4dSGIfRvGpr8uKJ81T4dO1_-9XRj0C21-aNqTTs4ji2Q-wSaZm-rtyogNqOIHA4bbQ",
 *     "message": "OTP has been sent to your mobile No. XXXXXX4101",
 *     "valid_for": 40
 * }
 * 
 */


/**
 * @api {post} /authentication/op/token Request To Verify OTP token
 * @apiName verifyOTPToken
 * @apiGroup authGroup
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *      "Authorization": "Basic <SECRET_KEY>",
 *      "Content-Type":"application/x-www-form-urlencoded"
 *     }
 * 
 * @apiBody {String} grant_type Mandtory Grant Type "retail_driver_sigin_mobile_otp" 
 * @apiBody {String} id_token  Id Token of retail driver signup request
 * @apiBody {String} otp  OTP 
 * 
 * 
 * @apiSuccessExample {json} Success-Response:
 *       HTTP/1.1 200 OK
 * {
 *     "access_token": "ZDlmNTcyNzUtNjQ4OC00YmJlLTkzMWItZGIyMjk1OTIyNGU2Pf6cQ6btqHsDAH-W7VCbnxtcdNEXQmxm56ci2QDkXWRPzJvD5E3v8QqqN0KbD25tFLmA4E-kTgHXaYPlPye57g",
 *     "expires_in": 3600,
 *     "token_type": "Bearer",
 *     "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNpZy1ycy0wIn0.eyJzdWIiOiI2MjMwNWQ1MjU2ODQ2MDQ2NTExZjFiNmViMTQ3OTM1M2Q3NzY3YTlmZTMwMjcxYjlhYzBiN2U0ZTMzYTVhNWNiIiwidmluIjoiTUExQ0EyWkE3UEpDNDY3NTUiLCJ1c2VybmFtZSI6IlBhd2FuIEt1bWFyIEp5YW5pIiwiY3VzdG9tZXIiOiI2ZmJhMzcxYy1hNGFhLTRjMDYtYTFmYy0xMzhlOWM3YmY2MzIiLCJkcml2aW5nX2xpY2VuY2UiOm51bGwsImVtYWlsIjoicmFtQGdtYWlsLmNvbSIsImRvYiI6bnVsbCwiZ2VuZGVyIjoibWFsZSIsImF2YWlsYWJpbGl0eSI6bnVsbCwibW9iaWxlIjoiODEyMzM4NDEwMSIsImZpcnN0X25hbWUiOiJQYXdhbiBLdW1hciIsImxhc3RfbmFtZSI6Ikp5YW5pIiwiYWRkcmVzcyI6IldBUkQgTk8gMDgsIFNVUkpBTldBU0kgSU5EUEFMUyBJTkRQQUxTQVIgLCBCSUtBTkVSLCBJTkRJQSwgMzMxODAzIiwiZm9yY2VQYXNzd29yZCI6bnVsbCwicm9sZSI6ImRyaXZlciIsInVzZXJfaWQiOiIxNDVkOTI1OC04NmQ5LTQ5MWEtODgwYS1jODQ0M2EyZGVhYTMiLCJhdF9oYXNoIjoiRVVUdkpMdVFyZkx6LTQ0NllZUktXdyIsInJ0X2hhc2giOiJSemdjQ2xjRlJPZFNMREF1Y3llejNRIiwic2lkIjoiMDkxMTJkMWMtZjBmYy00OGUzLTk3ODAtMjg5NmE0OWE1YjYyIiwiYXVkIjoiWk9SX0RFTU9fQ0xJRU5UIiwiZXhwIjoxNjkyNjg4NjQxLCJpYXQiOjE2OTI2ODUwNDEsImlzcyI6Imh0dHBzOi8vc3RnLW5lbW8ubWFoaW5kcmFlbGVjdHJpYy5jb20ifQ.d3DXMRp9jRFxCB_vdZoPY0jLierB1xeqosWMT_qs-Unw8J_dLbZsC-LQMUVkDRjiFwtdLjGNlWfYl3ytRbdxjAlbqh9C1xYNkpHgsnKSyeY4YxGgYtkYrd47ThvffcjJ-93g40vgM03QFw8Ib_SnekP0Sxi_YYhXJdGFMiBrpGo0L9Tu3lYbOOEhL9WIubZ7hxW00qTtLJetGFblExOdTZDBFonrHvIzKbYPnxhXgMjXI7_9d8k_TeTWtoobt8x8Ogzs5QNiUPysPxcC7122GpxGOvuXwj5sNVfQFFZcTiHL98nvlecIas4TaXuDRuapuxhHg6inLVmsDV_qDAqyow",
 *     "refresh_token": "MzU5ZmVhYzEtZWIwNy00YjE0LWFjYWQtNzQ0NDE4MWE4Y2Jh9hXNdcAO0no3crWAxjPK6khOTNzVde7dUm15Zt0i6QQpDMhkJ90qovrKKDXcLEq_Xj1Z7VDTbdw002x-JS9Ppw"
 * }
 * 
 */

/**
    * 
    * @api {post} /authentication/token Request To Login with MPIN 
    * @apiName mpinAuthentication
    * @apiGroup authGroup
    * @apiVersion  1.0.0
    * 
    *
    * @apiHeaderExample {json} Header-Example:
    *     {
    *       "Content-Type": "application/x-www-form-urlencoded",
    *       "Authorization": "Bearer ${ACCESSTOKEN}"
    *     }
    * 
    * @apiParamExample {json} RequestBodyExample:
    *   {    
    *      "grant_type":"retail_driver_sigin_mpin",
    *      "mpin":"XXXX",
    *      "mobile":"8123384101",
    *      "authentication_type":"MPIN/Biometric",
    *   }
    * @apiErrorExample {json} Error-Response:
    *   HTTP/1.1 400 BadRequest
    *     {
    *       "message": "Retry with the correct MPIN."
    *     } 
    * 
    * @apiSuccessExample {json} Success-Response:
    *    HTTP/1.1 200 OK
    *   {
    *     "access_token": "ZDlmNTcyNzUtNjQ4OC00YmJlLTkzMWItZGIyMjk1OTIyNGU2Pf6cQ6btqHsDAH-W7VCbnxtcdNEXQmxm56ci2QDkXWRPzJvD5E3v8QqqN0KbD25tFLmA4E-kTgHXaYPlPye57g",
    *     "token_type": "Bearer",
    *     "expires_in": 3600,
    *     "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6InNpZy1ycy0wIn0.eyJzdWIiOiI2MjMwNWQ1MjU2ODQ2MDQ2NTExZjFiNmViMTQ3OTM1M2Q3NzY3YTlmZTMwMjcxYjlhYzBiN2U0ZTMzYTVhNWNiIiwidmluIjoiTUExQ0EyWkE3UEpDNDY3NTUiLCJ1c2VybmFtZSI6IlBhd2FuIEt1bWFyIEp5YW5pIiwiY3VzdG9tZXIiOiI2ZmJhMzcxYy1hNGFhLTRjMDYtYTFmYy0xMzhlOWM3YmY2MzIiLCJkcml2aW5nX2xpY2VuY2UiOm51bGwsImVtYWlsIjoicmFtQGdtYWlsLmNvbSIsImRvYiI6bnVsbCwiZ2VuZGVyIjoibWFsZSIsImF2YWlsYWJpbGl0eSI6bnVsbCwibW9iaWxlIjoiODEyMzM4NDEwMSIsImZpcnN0X25hbWUiOiJQYXdhbiBLdW1hciIsImxhc3RfbmFtZSI6Ikp5YW5pIiwiYWRkcmVzcyI6IldBUkQgTk8gMDgsIFNVUkpBTldBU0kgSU5EUEFMUyBJTkRQQUxTQVIgLCBCSUtBTkVSLCBJTkRJQSwgMzMxODAzIiwiZm9yY2VQYXNzd29yZCI6bnVsbCwicm9sZSI6ImRyaXZlciIsInVzZXJfaWQiOiIxNDVkOTI1OC04NmQ5LTQ5MWEtODgwYS1jODQ0M2EyZGVhYTMiLCJhdF9oYXNoIjoiRVVUdkpMdVFyZkx6LTQ0NllZUktXdyIsInJ0X2hhc2giOiJSemdjQ2xjRlJPZFNMREF1Y3llejNRIiwic2lkIjoiMDkxMTJkMWMtZjBmYy00OGUzLTk3ODAtMjg5NmE0OWE1YjYyIiwiYXVkIjoiWk9SX0RFTU9fQ0xJRU5UIiwiZXhwIjoxNjkyNjg4NjQxLCJpYXQiOjE2OTI2ODUwNDEsImlzcyI6Imh0dHBzOi8vc3RnLW5lbW8ubWFoaW5kcmFlbGVjdHJpYy5jb20ifQ.d3DXMRp9jRFxCB_vdZoPY0jLierB1xeqosWMT_qs-Unw8J_dLbZsC-LQMUVkDRjiFwtdLjGNlWfYl3ytRbdxjAlbqh9C1xYNkpHgsnKSyeY4YxGgYtkYrd47ThvffcjJ-93g40vgM03QFw8Ib_SnekP0Sxi_YYhXJdGFMiBrpGo0L9Tu3lYbOOEhL9WIubZ7hxW00qTtLJetGFblExOdTZDBFonrHvIzKbYPnxhXgMjXI7_9d8k_TeTWtoobt8x8Ogzs5QNiUPysPxcC7122GpxGOvuXwj5sNVfQFFZcTiHL98nvlecIas4TaXuDRuapuxhHg6inLVmsDV_qDAqyow",
    *     "refresh_token": "MzU5ZmVhYzEtZWIwNy00YjE0LWFjYWQtNzQ0NDE4MWE4Y2Jh9hXNdcAO0no3crWAxjPK6khOTNzVde7dUm15Zt0i6QQpDMhkJ90qovrKKDXcLEq_Xj1Z7VDTbdw002x-JS9Ppw"
    *   }
*/

/**
 * @api {get} /authentication/op/me Request To Fetch User details
 * @apiName fetchUserDetails
 * @apiGroup authGroup
 * 
 * @apiHeaderExample {json} Header-Example:
 *     {
 *      "Authorization": "Bearer <access_token>",
 *      "Content-Type":"application/json"
 *     }
 * 
 * 
 * @apiSuccessExample {json} Success-Response:
 *       HTTP/1.1 200 OK
 * {
 *     "sub": "0b4f5028-b0dc-497c-af8d-c6899779348a",
 *     "user_id": "0b4f5028-b0dc-497c-af8d-c6899779348a",
 *     "fleet_name": "internal-user",
 *     "vin": null,
 *     "username": "cc-super-admin",
 *     "customer": "0498cb55-a2cd-4e6b-bfb5-fa79e123a394",
 *     "driving_licence": null,
 *     "email": "cc-super-admin@mahindra.com",
 *     "dob": null,
 *     "gender": null,
 *     "availability": null,
 *     "mobile": null,
 *     "first_name": "CC Super",
 *     "last_name": "Admin",
 *     "segment": "internal-user",
 *     "state": null,
 *     "pincode": null,
 *     "country": "India",
 *     "city": null,
 *     "address": null,
 *     "financier_id": null,
 *     "role": "cc-super-admin",
 *     "emp_id": null,
 *     "forcePassword": null
 * }
 * 
 */
 const validationCheckGuard = function (baseHref) {
    return function(req, res, next) {
        if(req.originalUrl.startsWith(`${baseHref}/vehicle/activate`) || req.originalUrl.includes(`${baseHref}/vehicle/list`)  || req.originalUrl.includes(`changeowner`)) next();
            else {
                if(req.ME.user.vin) next()
                else {
                    if(req.originalUrl.startsWith(`/driver/account/mpin`)) next();
                    else {
                        const token = getTokenFromHeaders(req.headers)
                        var options = {
                            method: 'GET',
                            uri: `${process.env.AUTH_OP_ME_URL}/authentication/op/me`,
                            headers: {
                                ...token,
                                "Content-Type":"application/application-json"
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
                            else res.status(403).json({ message : "UnAuthorized. Please login again."}).end();
                        })
                        .catch((err) => {
                            res.status(403).json({ message : "UnAuthorized. Please login again."}).end();
                        })
                    }
                }
            }
    }
}


const checkMPINIsActiveOrNot = function(req, res, next) {
    if(req.originalUrl.includes(`changeowner`)) return next();
    else {
        const token = getTokenFromHeaders(req.headers)
        var options = {
            method: 'GET',
            uri: `${process.env.AUTH_OP_ME_URL}/api/users/mpin/validation`,
            headers: {
                ...token,
            },json: true
        };

        return requestPromise(options)    
        .then((mpinFlag) => {
            if(mpinFlag) return next();
            else if(!req.ME.user.vin) return next();
            else return res.status(403).json({ message : "UnAuthorized. Please login again."}).end();
        })     
    }
}


const checkInvalidInputBody = function(req, res, next) {
    let regex = /^[A-Za-z0-9 ,()]+$/, insuranceRegex =  /^[a-zA-Z0-9 ]*$/, alphaNumerixRegex =  /^[A-Za-z0-9 _-]+$/, newRegex = /^[a-z]{2}$/, numberRegex = /^[0-9]+$/, numberDotRegex =  /^\d+(\.\d+)*$/, dateRegex = /^(0[1-9]|[12][0-9]|3[01])\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+(\d{4})$|^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])\s+([01][0-9]|2[0-3]):([0-5][0-9])$/;
    for (const key in req.body) {
        if (typeof req.body[key] === 'string') {
        if(key === 'language_code' && !(process.env.DRIVERAPP_LANGUAGES.includes(req.body[key])) && !newRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if((key === 'price' || key === 'clothing' || key === 'food' || key === 'house_rent' || key === 'monthly_emi' || key === 'others' || key === 'target' || key === 'longitude' || key === "latitude" || key === 'app_version' || key === 'mobile_os_version') && !numberDotRegex.test(req.body[key])) return res.status(400).json({message :constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end(); // Good
        else if(key === 'vehicle_model' && !(process.env.DRIVER_APP_MODELS.includes(req.body[key])))  return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if (key === 'mobile' && !numberRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if ((key === 'expiry_at') && !dateRegex.test(req.body[key])) return res.status(400).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if ((key === 'name' || key === 'segment' || key == 'created_by' || key === 'user_id' || key === 'customer_segment' || key === 'userId' ) && !alphaNumerixRegex.test(req.body[key])) return res.status(500).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else if ((key === 'insurance_name' || key === 'policyNo' ) && !insuranceRegex.test(req.body[key])) return res.status(500).json({message : constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
        else {
              if( !(key === 'clothing' || key === 'food' || key === 'house_rent' || key === 'monthly_emi' || key === 'others' || key === 'target' || key === 'mobile_os_version' || key === 'app_version' || key === 'insurance_name' ||  key === 'policyNo'  || key === 'user_id' ||  key === 'customer_segment' || key === 'vehicle_model' || key === 'name' || key === 'price' || key === 'location' || key === 'segment' || key === 'policyNo' || key == 'created_by' || key === 'expiry_at' || key === 'token' || key === 'refresh_token' || key == 'longitude' || key =='latitude'  || key === 'userId' || key === 'email' || key  === 'mobile_cellular' || key == 'country' || key === 'mobile_model') && (!regex.test(req.body[key]))) return res.status(500).json({message : key + ' ' +constant.message.INVALID_INPUT_MSG, code:"invalid_input"}).end();
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
    if(Object.hasOwn(reqHeaders, 'authorization')) return { 'Authorization' : reqHeaders['authorization']}
    else if(Object.hasOwn(reqHeaders, 'x-user-id-token')) return { 'x-user-id-token' : reqHeaders['x-user-id-token']}
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
    app.use(`${baseHref}/vehicle`, [userIdentityMiddleware, guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody, checkMPINIsActiveOrNot], vehicle(extraParams));
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
    app.use(`${baseHref}/earnings`, [userIdentityMiddleware], guardMiddleware, validationCheckGuard(baseHref), checkInvalidInputBody, earnings(extraParams));


app.get(`${baseHref}/health`, (req, res) => {
  res.status(200).json({ status: 'OK', uptime: process.uptime(), timestamp: Date.now() });
});



    return Promise.resolve();

}
