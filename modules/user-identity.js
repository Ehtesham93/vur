/**
* Middleware to parse the passed JWT token from authorization header
* and identity the user information and append them to the request object
*/
import { verify } from 'jsonwebtoken';
import jwkToPem from 'jwk-to-pem';
import NodeCache from 'node-cache';
import requestPromise from 'request-promise';
import Promise from 'bluebird';

import KVConfig from './kv-config';
import Logger from './logger';

const kvConfig = new KVConfig({});
const logger = new Logger();

const cache = new NodeCache();

/**
* Middleware to parse the JWT token from header
* @param {express.req} req - express request object
* @param {express.res} res - express response object
* @param {express.next} next - express callback function, to be called by the middleware function
*/
module.exports = function(req, res, next)
{
    req.ME = req.ME || {};
    req.ME.logger = req.ME.logger || logger;
    req.ME.user = req.ME.user || {};

    req.ME.logger.info('Parsing user identity');

    /**
    * private function to parse the hedaer and return the token
    */
    const _getToken = function()
    {
        return req.headers['x-user-id-token'] || '';
    }

    /**
    * private function to return the certificate
    * @param {string} kid - key id recieved in token header
    * @returns {Promise} returns certificate
    */
    const _getCertification = function(kid)
    {
        return new Promise((resolve, reject) =>
        {
            cache.get(kid, (cert) =>
            {
                if (cert)
                {
                    return resolve(cert);
                }

                kvConfig.get('auth/server').then((authServer) =>
                {
                    const authEndpoint = `http://${authServer}/authentication/op/.well-known/openid-configuration`;

                    return requestPromise({
                        uri: authEndpoint,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    })
                    .then((discovery) =>
                    {
                        discovery = JSON.parse(discovery);
                        return Promise.resolve(discovery.jwks_uri);
                    })
                })
                .then((certURL) =>
                {
                    return requestPromise({
                        uri: certURL,
                        headers: {
                            'Content-Type': 'application/json'
                        }
                    });
                })
                .then((certificates) =>
                {
                    certificates = JSON.parse(certificates);

                    let cert = null;

                    certificates.keys.map((key) =>
                    {
                        if (key.kid == kid)
                        {
                            cert = jwkToPem(key);
                        }
                    })

                    if (!cert)
                    {
                        return Promise.reject("No certification found");
                    }

                    return Promise.all([cert, cache.set(kid, cert, 3600)]);
                })
                .spread((cert) =>
                {
                    return resolve(cert);
                })
            });
        })
    }

    const token = _getToken();

    if (token)
    {
        const header = JSON.parse(Buffer.from(token.split('.').shift(), 'base64'));
        const kid = header.kid;

        _getCertification(kid)
        .then((certs) =>
        {
            const payload = verify(token, certs);
            req.ME.user = payload;
            next()
        })
        .catch((err) =>
        {
            req.ME.logger.info('Parsing user identity');
            next();
        });
    }
    else
    {
        next();
    }
}
