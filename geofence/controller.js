const requestPromise = require("request-promise");
const { QueryTypes } = require('sequelize');

exports.getDriverAppGeofence = function(data){
    var options = {
        method: 'GET',
        uri: `${process.env.GEOFENCE_LAMBDA_URL}/api/driver/geofences?vin=${data.vin}&category=${data.category}`,
        header:{
            'Content-Type': 'application/json'
        },
        json: true 
    };
    return requestPromise(options)
    .then((data) => data)
    .catch((err) => { return err; })
}

exports.createDriverAppGeofence = function(data){
    var options = {
        method: 'POST',
        uri: `${process.env.GEOFENCE_LAMBDA_URL}/api/driver/geofences`,
        body: data,
        json: true 
    };
    return requestPromise(options)
    .then((data) => data)
    .catch((err) => { return err; })
}



exports.editDriverAppGeofence = function(id, data, customer, postgresDB){
    return chkGeofenceByCustomer(id, customer, postgresDB)
    .then(() => {
        var options = {
            method: 'PUT',
            uri: `${process.env.GEOFENCE_LAMBDA_URL}/api/driver/geofences/${id}`,
            body: data,
            json: true 
        };
        return requestPromise(options)
        .then((data) => data)
        .catch((err) => { return err })
    })
    .catch((err) => { throw err })
}

exports.deleteDriverAppGeofence = function(id, customer, postgresDB){
    return chkGeofenceByCustomer(id, customer, postgresDB)
    .then(() => {
        var options = {
            method: 'DELETE',
            uri: `${process.env.GEOFENCE_LAMBDA_URL}/api/driver/geofences/${id}`,
            json: true 
        };
        return requestPromise(options)
        .then((data) => data)
        .catch((err) => { return err })
    })
    .catch((err) => { throw err })

}

function chkGeofenceByCustomer(geofenceId, customer, postgresDB) {
    let geofenceQuery = `Select * from geofence_new where id = ${geofenceId} AND created_by = '${customer}'`;
    return postgresDB.sequelize.query(geofenceQuery, { type: QueryTypes.SELECT})
    .then((geofenceData) => {
        if(geofenceData) return geofenceData;
        else return Promise.reject({message: "Geofence is not mapped with this user."})
    })
    .catch((err) => { throw err; })
}
