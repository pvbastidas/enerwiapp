'use strict';

describe('<Unit Test> geoService', function () {

  var geoService, $window, esFactory, $scope, deferred;

  var sampleNearestLocations = [];

  var esresponse = '{"took":2,"hits":{"total":2,"max_score":1,"hits":[{"_source"' +
    ':{"image":{},"createdAt":"2016-10-09T20:28:18.000Z","location":{"lat":-4.00' +
    '0469,"lon":-79.209898},"name":"prueba de store","descripcion":"una prueba"}' +
    ',"_score":1,"_id":"57faa862af4615c6e13e3150","_index":"enerwi","_type":"sto' +
    're"},{"_source":{"location":{"lon":-79.2022740840912,"lat":-4.0320781051696' +
    '6},"name":"Koken Coffee Shop","image":"/path/to/the/image"},"_score":1,"_id' +
    '":"1","_index":"enerwi","_type":"store"}]},"_shards":{"total":2,"failed":0,' +
    '"successful":2},"timed_out":false}';

  var searchResponse = '{"_shards":{"total":2,"failed":0,"successful":2},"took":4,"hits":{"max_score":n' +
                        'ull,"hits":[{"_id":"1","_source":{"address":"La Argelia","location":{"lon":-79.' +
                        '2022740840912,"lat":-4.03207810516966},"name":"Koken Coffee Shop","image":{"hei' +
                        'ght":117,"secure_url":"https://res.cloudinary.com/keystone-demo/image/upload/v1' +
                        '476219410/g1i31lg467hjkm9xkgmu.png","resource_type":"image","version":147621941' +
                        '0,"width":180,"signature":"cc144c8cece5816d61237990f7dbcbda44aea770","public_id' +
                        '":"g1i31lg467hjkm9xkgmu","url":"http://res.cloudinary.com/keystone-demo/image/u' +
                        'pload/v1476219410/g1i31lg467hjkm9xkgmu.png","format":"png"}},"_score":null,"_in' +
                        'dex":"enerwi","sort":[0.0226527117002603],"_type":"store"}],"total":1},"timed_o' +
                        'ut":false}';

  sampleNearestLocations = esresponse.hits;

  beforeEach(module('app.services'));

  beforeEach(function () {
    module('app.services', function ($provide) {
      $provide.factory('$window', function () {
        return {
          navigator: {
            geolocation: {
              getCurrentPosition: function(done){
                done({coords: {latitude: -4.0321609, longitude: -79.20211739999999}});
                //done({coords:{latitude: -4.03207810516966, longitude: -79.2022740840912}});
                //done({coords: {latitude: -4.0321378, longitude: -79.2020797}});
              }
            }
          },
          localStorage: {
            getItem: function(q){
              if (q === 'lastLocation')
                return '{"lat": "0987", "lon": "6543"}';

              return sampleNearestLocations;
            },
            setItem: function(){}
          }
        }
      });

      $provide.factory('esFactory', function ($q) {
        deferred = $q.defer();

        return function(){
          return {
            search: function(){
                return deferred.promise
              }
            };
        };
      });

    });

    module('app.constants', function ($provide) {
      $provide.constant('CONFIG', {
        client_id_google: 'test',
        google_apis: 'test',
        neatest_point_url: 'http://localhost:9200/'
      });
    });
  });

  beforeEach(inject(function (_geoService_, _$window_,  _esFactory_, $rootScope) {
    geoService = _geoService_;
    $window = _$window_;
    esFactory = _esFactory_;
    $scope = $rootScope.$new();

    //spyOn($window.navigator.geolocation, 'getCurrentPosition').and.returnValue($q.when({lat: '1234', lon: '5678'}));;
  }));

  it('should init the service', function () {
    expect(geoService).toBeDefined();
  });

  it('should gather the current position', function () {
    spyOn($window.localStorage, 'getItem').and.returnValue('{"lat": "0987", "lon": "6543"}');
    spyOn($window.navigator.geolocation, 'getCurrentPosition').and.callThrough();
    var cur = geoService.getCurrentLocation();

    expect(cur).toBeDefined();
    expect($window.navigator.geolocation.getCurrentPosition).toHaveBeenCalled();

    expect(geoService.getLastLocation().coords.latitude).toBe(-4.0321609);
    expect(geoService.getLastLocation().coords.longitude).toBe(-79.20211739999999);
  });

  it('the geoservice should get the charging points', function () {

    // $httpBackend.expectGET('/api/nearest_points/1234/5678/1000').respond(sampleNearestLocations);
    //var cur = geoService.getCurrentLocation();
    deferred.resolve(JSON.parse(esresponse));

    var cur = {lat: "1234", lon: "5678"};
    var maxDistance = 1000; // distance in meters
    var chargingPoints;

    geoService.getNearestChargingPoints(cur, maxDistance)
      .then(function(resp){
        chargingPoints = resp;
      });

    $scope.$apply();

    expect(chargingPoints.length).toBe(2);
  });

  fit('the geoservice should get all enerwi charging points', function () {

    // $httpBackend.expectGET('/api/nearest_points/1234/5678/1000').respond(sampleNearestLocations);
    //var cur = geoService.getCurrentLocation();
    deferred.resolve(JSON.parse(esresponse));

    var cur = {lat: "1234", lon: "5678"};
    var maxDistance = 1000; // distance in meters
    var chargingPoints;

    geoService.getAllEnerwiPoints(cur)
      .then(function(resp){
        chargingPoints = resp;
      });

    $scope.$apply();

    expect(chargingPoints.length).toBe(2);
  });

  it('should be polite if it is in offline mode', function(){
    // spyOn($window, 'localStorage').and.returnValue(myLocalStorage);
    var latlon = geoService.getLastLocation();
    var chargingPoints = [];
    $scope.$digest();

    //returning the location from localStorage
    expect(geoService.getLastLocation().lat).toBe("0987");
    expect(geoService.getLastLocation().lon).toBe("6543");

    //return the chargingPoints found in localStorage if no network
    deferred.resolve(JSON.parse(esresponse));
    geoService.getNearestChargingPoints(latlon, 1000)
      .then(function(resp){
        chargingPoints = resp;
      });
    $scope.$digest();

    expect(chargingPoints.length).toBe(2);
  });

  it('the geoservice should tell if user is in x location with tolerance t', function () {
    var r;
    var koken = {lat: -4.032165099999999, lon: -79.2023359};

    geoService.isUserInStorePoint(koken, 25).then(function(v){
      r = v;
    });
    $scope.$digest();

    expect(r).toBe(true);

    geoService.isUserInStorePoint(koken, 15).then(function(v){
      r = v;
    });
    $scope.$digest();

    expect(r).toBe(false);
  });

  it('the geoservice should get the average distance from points', function () {
    var points = [{"lat":-4.0321181,"lon":-79.20227408409119}, {"lat":-4.03207810516966,"lon":-79.202022}];

    var d = geoService.getAvgDistance(points)

    expect(Math.floor(d)).toBe(28);
  });

  it('the geoservice should get the store points that matches with the search term', function () {
    deferred.resolve(JSON.parse(searchResponse));

    var searchTerm = 'koken';

    geoService.searchStorePoints(searchTerm).then(function(results){
      expect(results.length).toBe(1);
    });
    $scope.$digest();
  });
});
