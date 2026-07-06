import extend from 'extend';
import Promise from 'bluebird';
import request from 'request-promise';
import chai from 'chai';
import chaiHttp from 'chai-http';

const expect = chai.expect;

chai.use(chaiHttp);


/**
* Unit test script initilizes the test base script
*
* This class provides init function to define the mocha and chai based API test functions
*  configuration. For further information see [DefaultConfig]{@link unitTest.DefaultConfig}.
*
* @param {object} config - For a list of possible configuration values see [DefaultConfig]{@link unitTest.DefaultConfig}.
* @constructor
*/
const unitTest = function(config)
{
    this.config = extend(true, unitTest.DefaultConfig, config);
    this.server = null;
    this.userDetails = {};

    /**
    * Function to return the server information
    * @returns {AppInit}
    */
    this.getServer = () =>
    {
        return this.server;
    }

    /**
    * Function to return the userdetail from the auth server
    * @param {string} key - the user identity key which should be retrieved, which is defined in the config
    * @returns {object}
    */
    this.getUserDetail = (key) =>
    {
        key = !key ? 'default' : key;
        return this.userDetail[key];
    }
}

/**
* Default configuration for the Unit test script
*
* @property {string} [credentials.default.username=test] - username to get the token informations
* @property {string} [credentials.default.password=test] - password to get the token information
* @property {string} [authHost=localhost] - hostname of the auth server
* @property {string} [healthCheckEndpoint=/api/health/check] - Endpoint to check whether the api is up or down [default: /api/health/check]
* @property {string} [appFile=${process.cwd()}/src/app] - app Js file path with file name, should return Promise, which returns the express app
*/
unitTest.DefaultConfig = {
    credentials: {
        default: {
            username: 'test',
            password: 'test'
        }
    },
    authHost: process.env.TEST_AUTH_SERVER || 'localhost',
    healthCheckEndpoint: '/api/health/check',
    appFile: `${process.cwd()}/src/app`
}

/**
* Function to initlize the test script, needs to be supplied as a argument to a function
* @param {Mocha.describe} https://mochajs.org/#asynchronous-code
*
* @returns {Mocha.describe} https://mochajs.org/#asynchronous-code
*/
unitTest.prototype.init = function(testcases)
{
    const startServer = require(this.config.appFile);

    const clientId = process.env.TEST_CLIENT_ID;
    const clientSecret = process.env.TEST_CLIENT_SECRET;
    const clientIdentity = new Buffer(`${clientId}:${clientSecret}`).toString('base64');
    
    const authEndpoint = `http://${ this.config.authHost }/authentication/op/token`;
    return describe('Service APIs', () =>
    {
        before((done) =>
        {
            let credentials = {};

            for (var credential in this.config.credentials)
            {
                credentials[credential] = request({
                    url: authEndpoint,
                    method: 'POST',
                    json: true,
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                        'Authorization': 'Basic ' + clientIdentity
                    },
                    form: {
                        login: this.config.credentials[credential].username,
                        password: this.config.credentials[credential].password,
                        grant_type: 'password'
                    }
                })
            }

            Promise.all(
                [
                    startServer,
                    Promise.props(credentials)
                ]
            )
            .spread((apiServer, userDetails) =>
            {
                this.server = apiServer;
                this.userDetail = userDetails;

                done();
            })
            .catch((err) => 
            {
                done(err);
            });
        });

        it('App Health check', (done) =>
        {
            chai.request(this.server)
            .get(this.config.healthCheckEndpoint)
            .end((err, res) =>
            {
                expect(res).to.have.status(200);
                done();
            });
        });

        testcases();

        after((done) =>
        {
            // process.exit();
            setTimeout(() => {
                this.server.end();
            }, 8000)

            done();
        })
    });
}

module.exports = unitTest;
