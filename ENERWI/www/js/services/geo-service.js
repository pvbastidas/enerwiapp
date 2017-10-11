'use strict';
angular.module('app.services')
.service('geoService', function ($q, $window, CONFIG, esFactory) {
  var lastLocation, lastNearestChargingPoints, lastDistance;

  var client = esFactory({
    host: CONFIG.nearest_point_url
  });

  return {
    getCurrentLocation: getCurrentLocation,
    getNearestChargingPoints: getNearestChargingPoints,
    getAllEnerwiPoints: getAllEnerwiPoints,
    getLastLocation: getLastLocation,
    getStorePointById: getStorePointById,
    isUserInStorePoint: isUserInStorePoint,
    getAvgDistance: getAvgDistance,
    searchStorePoints: searchStorePoints,
    getLastNearestChargingPoints: getLastNearestChargingPoints,
    getLastDistance: getLastDistance,
    getDistances: getDistances
  };


  function getCurrentLocation () {
    var deferred = $q.defer();

    $window.navigator.geolocation.getCurrentPosition(function(position) {
      lastLocation = position;

      var locationJson = {
        coords: {
          latitude: position.coords.latitude,
          longitude:  position.coords.longitude
        }
      }

      $window.localStorage.setItem('lastLocation', JSON.stringify(locationJson));
      deferred.resolve(position);
    }, function(error) {
      if(error.PERMISSION_DENIED === error.code) {
        deferred.reject('PERMISSION_DENIED');
      }
    });

    return deferred.promise;
  }

  function getNearestChargingPoints(curPos, threshold){
    var deferred = $q.defer();

    var query = {
      "sort" : [{
        "_geo_distance" : {
          "unit" : "km",
          "order" : "asc",
          "distance_type" : "plane",
          "location" : {
            "lat" : curPos.lat,
            "lon" : curPos.lon
          }
        }
      }],
      "filter" : {
        "geo_distance" : {
          "location" : {
            "lat" : curPos.lat,
            "lon" : curPos.lon
          },
          "distance" : threshold
        }
      },
      "query" : {
        "match_all" : {}
      },
      'size': 1000
    };

    client.search({
      'index': 'enerwi',
      'body': query
    }).then(function(result) {
      var stores = parseResponse(result);
      $window.localStorage.setItem('lastNearestChargingPoints', JSON.stringify(stores));
      deferred.resolve(stores);
    }, function(){
      console.log('DEBUG:', arguments);
    });

    return deferred.promise;
  }

  function getAllEnerwiPoints(curPos){
    var deferred = $q.defer();

    var query = {
      "sort" : [{
        "_geo_distance" : {
          "unit" : "km",
          "order" : "asc",
          "distance_type" : "plane",
          "location" : {
            "lat" : curPos.lat,
            "lon" : curPos.lon
          }
        }
      }],
      "query" : {
        "match_all" : {}
      },
      'size': 1000
    };

    client.search({
      'index': 'enerwi',
      'body': query
    }).then(function(result) {
      var stores = parseResponse(result);
      $window.localStorage.setItem('lastNearestChargingPoints', JSON.stringify(stores));
      deferred.resolve(stores);
    }, function(){
      console.log('DEBUG:', arguments);
    });

    return deferred.promise;
  }

  function getLastLocation (){
    var storedLocation = JSON.parse($window.localStorage.getItem('lastLocation'));
    return lastLocation || storedLocation;
  }

  function getLastNearestChargingPoints () {
    return JSON.parse($window.localStorage.getItem('lastNearestChargingPoints'));
  }

  function getStorePointById (id) {
    var points = JSON.parse($window.localStorage.getItem('lastNearestChargingPoints'));
    return _.find(points, {'id': id});
  }

  function getDistances(p0, p){
      var R = 6371; // Radius of the earth in km
      var dLat = deg2rad(p.lat - p0.lat);
      var dLon = deg2rad(p.lon - p0.lon);

      var a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(deg2rad(p0.lat)) * Math.cos(deg2rad(p.lat)) *
              Math.sin(dLon/2) * Math.sin(dLon/2) ;
      var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c * 1000; // Distance in km
  }

  function isUserInStorePoint(p, tolerance){
    return getCurrentLocation().then(function(position){
      var p0 = {lat: position.coords.latitude, lon: position.coords.longitude};
      console.log('Current Location >', p);

      lastDistance = getDistances(p0, p);
      console.log('Distance >', lastDistance);

      return lastDistance <= (tolerance || CONFIG.min_distance_for_store);
    });
  }

  function deg2rad(deg) {
    return deg * (Math.PI/180)
  }

  function getLastDistance(){
    return lastDistance;
  }

  function getAvgDistance(points){
    return _.reduce(points, function(d, e){
      var c = _.max(_.map(points, function(e1){
        return getDistances(e1, e);
      }));
      return c > d ? c : d;
    }, 0);
  }

  function searchStorePoints(curPos, searchTerm) {
    var deferred = $q.defer();

    var query = {
      "sort" : [{
        "_geo_distance" : {
          "unit" : "km",
          "order" : "asc",
          "distance_type" : "plane",
          "location" : {
            "lat" : curPos.lat,
            "lon" : curPos.lon
          }
        }
      }],
      "query" : {
        "match" : {
          'name': searchTerm
        }
      },
      'size': 1000
    };

    client.search({
      'index': 'enerwi',
      'body': query
    }).then(function(result) {
      var stores = parseResponse(result);

      deferred.resolve(stores);
    });

    return deferred.promise;
  }

  function parseResponse (result) {
    var ii = 0, hits_in, hits_out = [];
    hits_in = (result.hits || {}).hits || [];
    for (;ii < hits_in.length; ii++){
      var data = hits_in[ii]._source;
      var distance = {};

      if (hits_in[ii].sort){
        distance = {"distance": parseFloat(hits_in[ii].sort[0] * 1000).toFixed()} // cambiando a m
      }

      if (hits_in[ii]._id) {
        angular.extend(data, {
          "id": hits_in[ii]._id
        });
      }

      angular.extend(data, distance);
      hits_out.push(data);
    }

    return hits_out;
  }
});


