import extend from 'extend';
import NodeCache from 'node-cache';
import requestPromise from 'request-promise';
import Promise from 'bluebird';
import retry from 'bluebird-retry';

import Logger from './logger';
import KVConfig from './kv-config';
import RedisAdapterDefaultDB from '../services/redis-listener-default';

const cache = new NodeCache();
const kvConfig = new KVConfig();
const fs = require('fs');
const redisAdapter = new RedisAdapterDefaultDB();

/**
* ServiceClient
*
* A proxy for services to call other services
* configuration. For further information see [DefaultConfig]{@link ServiceClient.DefaultConfig}.
*
* @param {object} config - For a list of possible configuration values see [DefaultConfig]{@link ACLClient.DefaultConfig}.
* @constructor
*/
const ServiceClient = function(config)
{
    this.config = extend(true, ServiceClient.DefaultConfig, config);

    this.tokenName = 'x-user-id-token';
}

/**
 * private function to get the token for the given username and password
 * @return {Promise}
 */
ServiceClient.prototype._getToken = function()
{
    return new Promise((resolve, reject) => 
    {
        let token = cache.get(this.tokenName);

        if (token)
        {
            return resolve(token);
        }

        Promise.all([
            kvConfig.get(this.config.authServerKey),
            kvConfig.get(this.config.serviceUserKey),
            kvConfig.get(this.config.servicePassword),
            kvConfig.get(this.config.clientIdKey),
            kvConfig.get(this.config.clientSecretKey)
        ])
        .spread((authServer, serviceUserName, servicePassword, clientId, clientSecret) => 
        {
            const clientIdentity = new Buffer(`${clientId}:${clientSecret}`).toString('base64');
            const authEndpoint = `http://${authServer}/authentication/op/token`;
            
            return requestPromise({
                url: authEndpoint,
                method: 'POST',
                json: true,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': 'Basic ' + clientIdentity
                },
                form: {
                    login: serviceUserName,
                    password: servicePassword,
                    grant_type: 'password'
                }
            });
        })
        .then((tokens) => 
        {
            //cache.set(this.tokenName, tokens.id_token, 3600 - 600);
            //cache.set(this.tokenName, tokens.id_token, tokens.expires_in ? tokens.expires_in - (10 * 60) : (10 * 60));
            //resolve(tokens.id_token);
            let tokenExpiry = tokens.expires_in ? tokens.expires_in - (10 * 60) : (10 * 60);

            tokenExpiry = tokenExpiry > 0 ? tokenExpiry : 10;

            cache.set(this.tokenName, tokens.id_token, tokenExpiry);

            resolve(tokens.id_token);
        })
        .catch((err) => 
        {
            this.config.logger.warn(err);
            reject(err);
        });
    });
}

/**
 * function to decide the send content should be form or body
 * @param {String} contentType content type needs to be checked
 * 
 * @return {String}
 */
ServiceClient.prototype._getParamForContentType = function(contentType)
{
    switch(contentType)
    {
        case 'application/json':
        return 'body';

        case 'application/x-www-form-urlencoded':
        return 'form';

        default:
        return 'form';
    }
}

/**
 * private function to call the service, a common function to call any service
 * 
 * @param {String} method method to be called
 * @param {String} serviceKey key for service information
 * @param {String} url url to be called on the service
 * @param {Object} headers header object
 * @param {Object} data data object
 * @param {Boolean} isBinary is the data binary or not
 * @param {String} token user id token
 *
 * @return {Promise}
 */
ServiceClient.prototype._call = function(method, serviceKey, url, headers, data, isBinary, token)
{
    const _callService = () => 
    {
        return new Promise((resolve, reject) => 
        {
            Promise.all([
                kvConfig.get(serviceKey),
                token ? Promise.resolve(token) : retry(this._getToken.bind(this), { max_tries: 8, interval: 500 })
            ])
            .spread((serviceAddress, token) => 
            {
                const endpoint = `http://${serviceAddress}${url}`;
                
                headers = {
                    'Content-Type': 'application/json',
                    'X-USER-ID-TOKEN': token,
                    // ...headers
                }

                let requestObject = {};

                if (isBinary)
                {
                    requestObject = {
                        url: endpoint,
                        method: method,
                        json: true,
                        headers: headers
                    };

                    requestObject.encoding = null;
                }
                else
                {
                    requestObject = {
                        url: endpoint,
                        method: method,
                        json: true,
                        headers: headers,
                        transform: (body, response) => {
                            let resultBody = body;
                            try 
                            {
                                resultBody = checkResponseBody(body)
                            }
                            catch(e)
                            {
                                this.config.logger.warn(e);
                                resultBody = body;
                            }

                            return {status: response.statusCode, statusCode: response.statusCode, body: resultBody};
                        }
                    };
                }

                if (data)
                {
                    requestObject[this._getParamForContentType(headers['Content-Type'])] = data;
                }
        
                return requestPromise(requestObject)
                
            })
            .then((response) => 
            {
                resolve(response)
            })
            .catch((err) => 
            {
                this.config.logger.warn(err);
                reject({statusCode: err.response.statusCode, status: err.response.statusCode, body: err.response.body});
            });
        });
    }

    return _callService()
}

ServiceClient.prototype._fetchTokenForDriverApp = function (method, serviceKey, url, headers, data) {
    const _callService = () => {
        return new Promise((resolve, reject) => {
            Promise.all([
                kvConfig.get(serviceKey),
            ])
                .spread((serviceAddress, token) => {
                    const endpoint = `http://${serviceAddress}${url}`;
                    headers = {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'authorization':headers['authorization']
                    }
                    let requestObject = {
                            url: endpoint,
                            method: method,
                            json: true,
                            headers: headers,
                            transform: (body, response) => {
                                let resultBody = body;
                                try {
                                    resultBody = checkResponseBody(body);
                                }
                                catch (e) {
                                    this.config.logger.warn(e);
                                    resultBody = body;
                                }
                                return { status: response.statusCode, statusCode: response.statusCode, body: resultBody };
                            }
                        };

                    if (data) {
                        requestObject[this._getParamForContentType(headers['Content-Type'])] = data;
                    }

                    return requestPromise(requestObject)

                })
                .then(async (response) => {
                    let kongAccessKey = `kong:accesss_token:${response.body.access_token}`;
                    let kongAccessValue = JSON.stringify(response.body);
                    await redisAdapter.setKongAccessToken(kongAccessKey, kongAccessValue, response.body.expires_in)
                    resolve(response)
                })
                .catch((err) => {
                    reject({ statusCode: err.response ? err.response.statusCode : 500, status: err.response ? err.response.statusCode : 500, body: err.response ? err.response.body : err.body });
                });
        });
    }

    return _callService();
}

ServiceClient.prototype._sendFileUploadRequest = function(method, serviceKey, url, headers, fileDetails, token)
{
    const _fileUploadRequest = () => 
    {
        return new Promise((resolve, reject) => 
        {
            Promise.all([
                kvConfig.get(serviceKey),
                token ? Promise.resolve(token) : retry(this._getToken.bind(this), { max_tries: 8, interval: 500 })
            ])
            .spread((serviceAddress, token) => 
            {
                const endpoint = `http://${serviceAddress}${url}`;
                
                headers = {
                    'X-USER-ID-TOKEN': token,
                    ...headers
                }
                let requestObject = {
                    url: endpoint,
                    method: method,
                    headers: headers,
                    formData: {
                        data: {
                            value: fs.createReadStream(fileDetails.path),
                            options: {
                                filename: fileDetails.filename,
                                contentType: fileDetails.mimetype
                            }
                        }
                    },
                    transform: (body, response) => {
                        let resultBody = body;
                        try 
                        {
                            resultBody = checkResponseBody(body)
                        }
                        catch(e)
                        {
                            this.config.logger.warn(e);
                            resultBody = body;
                        }

                        return {status: response.statusCode, statusCode: response.statusCode, body: resultBody};
                    }
                };
                return requestPromise(requestObject)
                .then((response) => 
                {
                    resolve(response)
                })
                .catch((err) => 
                {
                    throw err;
                });
            })
        });
    }

    return retry(_fileUploadRequest, { max_tries: 3, interval: 500 });
}



function checkResponseBody(body) {
    if (typeof (body) == 'string') return JSON.parse(body);
    else return body;
}


/**
 * get function to call the service, a common function to call any service
 * 
 * @param {String} serviceKey key for service information
 * @param {String} url url to be called on the service
 * @param {Object} headers header object
 * @param {Object} data data object
 * @param {Boolean} isBinary is the data binary or not
 * @param {String} token user id token
 *
 * @return {Promise}
 */
ServiceClient.prototype.get = function(serviceKey, url, headers, isBinary, token)
{
    return this._call('GET', serviceKey, url, headers, null, isBinary, token)
}

/**
 * put function to call the service, a common function to call any service
 * 
 * @param {String} serviceKey key for service information
 * @param {String} url url to be called on the service
 * @param {Object} headers header object
 * @param {Object} data data object
 * @param {Boolean} isBinary is the data binary or not
 * @param {String} token user id token
 *
 * @return {Promise}
 */
ServiceClient.prototype.put = function(serviceKey, url, headers, data, isBinary, token)
{
    return this._call('PUT', serviceKey, url, headers, data, isBinary, token);
}

/**
 * psot function to call the service, a common function to call any service
 * 
 * @param {String} serviceKey key for service information
 * @param {String} url url to be called on the service
 * @param {Object} headers header object
 * @param {Object} data data object
 * @param {Boolean} isBinary is the data binary or not
 * @param {String} token user id token
 *
 * @return {Promise}
 */
ServiceClient.prototype.post = function(serviceKey, url, headers, data, isBinary, token, fileUpload = false, tokenFlag = false)
{
    if(fileUpload) return this._sendFileUploadRequest('POST',serviceKey, url, headers, data,  token)
    else if(tokenFlag) return this._fetchTokenForDriverApp('POST', serviceKey, url, headers, data)
    else return this._call('POST', serviceKey, url, headers, data, isBinary, token);
}

/**
 * delete function to call the service, a common function to call any service
 * 
 * @param {String} serviceKey key for service information
 * @param {String} url url to be called on the service
 * @param {Object} headers header object
 * @param {Object} data data object
 * @param {Boolean} isBinary is the data binary or not
 * @param {String} token user id token
 *
 * @return {Promise}
 */
ServiceClient.prototype.delete = function(serviceKey, url, headers, data, isBinary, token)
{
    return this._call('DELETE', serviceKey, url, headers, data, isBinary, token);
}

/**
* Default configuration for the ACL client middleware
*
* @property {string} authServerKey - auth service key
* @property {string} serviceUserKey - service user key
* @property {string} servicePassword - service password key
* @property {string} clientIdKey - client id key, oauth
* @property {string} clientSecretKey - Client secret, oauth
* @property {Logger} logger - Logger instance
*/
ServiceClient.DefaultConfig = {
    authServerKey: 'auth/server',
    serviceUserKey: 'service/username',
    servicePassword: 'service/password',
    logger: new Logger(),
    clientIdKey: 'client/id',
    clientSecretKey: 'client/secret'
}

module.exports = ServiceClient;
