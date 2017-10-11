'use strict';

describe('<Unit Test> chargeService', function () {
  var $window, chargeService, $httpBackend, geoService, $interval, $scope, CONFIG;

  beforeEach(module('app.services'));

  beforeEach(function () {
    module('app.services', function ($provide) {
      $provide.factory('$window', function () {
        return {
          localStorage: {
            getItem: function(q){
              if (q === 'lastLocation')
                return '{"lat": "0987", "lon": "6543"}';

              return sampleNearestLocations;
            },
            setItem: function(){},
            removeItem: function(){}
          },
          ionic: {
            Platform: {
              platform: function () {
                return 'macintel';
              }
            }
          }
        }
      });

      $provide.service('$cordovaDevice', function () {
        return {
          getUUID: function(){ return "ideDevice";}
        };
      });

      $provide.service('loginService', function () {
        return {
          getUser: function(){
            return {"_id":"102353903095411604358","name":"Pancho villa","email":"pancho@gmail.com","image":"https://l/photo.jpg","accessToken":"atolen"}
          }
        };
      });

      $provide.service('geoService', function ($q) {
        return {
          getLastLocation: function(){
            return {coords: {latitude: 123, longitude: 1234}};
          },
          isUserInStorePoint: function() {
            return $q.when(false);
          }
        };
      });
    });

    module('app.constants', function ($provide) {
      $provide.constant('CONFIG', {
        track_charge_url: '/api/track_charge',
        check_location_time: 1000
      });
    });
  });

  beforeEach(inject(function (_$window_, _chargeService_, _$httpBackend_, _geoService_, _$interval_, $rootScope, _CONFIG_) {
    $window = _$window_;
    chargeService = _chargeService_;
    $httpBackend = _$httpBackend_;
    geoService = _geoService_;
    $interval = _$interval_;
    $scope = $rootScope.$new();
    CONFIG = _CONFIG_;
  }));

  afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
  });

  it('should init the service', function () {
    expect(chargeService).toBeDefined();
  });

  it('should post the charging event into the backend', function(){
    var data = {"device_id":"testuuid", "_id": "102353903095411604358", store_id: 123};

    $httpBackend.expectPOST('/api/track_charge/start', data).respond({"resp":"ok"});

    chargeService.startChargeInLocation({id: 123});
    $httpBackend.flush();
  });

  it('should post the stop charging event into the backend', function(){
    var data = {"device_id":"testuuid", "_id": "102353903095411604358", store_id: 123};

    $httpBackend.expectPOST('/api/track_charge/stop', data).respond({"resp":"ok"});

    chargeService.stopChargeInLocation(123);
    $httpBackend.flush();
  });

  it('should get the history for the current user', function() {
    //var data = {"user_id":"102353903095411604358"}

    $httpBackend.expectGET('/api/track_charge/history/1/10/102353903095411604358').respond([{}]);

    chargeService.getHistory();
    $httpBackend.flush();
  });

  it('should get the historu for the current user in the current store', function() {
    $httpBackend.expectGET('/api/track_charge/history_by_store/102353903095411604358/1').respond([{}]);

    chargeService.getHistoryStore(1);
    $httpBackend.flush();

  });

  it('should log the checkLocation fails if there is check_location_num', function(){
    var data = {"device_id":"testuuid", "store_id": 123, "_id": "102353903095411604358"};
    CONFIG['check_location_num'] = 2;

    spyOn(geoService, "getLastLocation").and.returnValue({coords: {latitude: 123, longitude: 1234}});

    $httpBackend.expectPOST('/api/track_charge/start', data).respond({"resp":"ok"});

    chargeService.startChargeInLocation({id: 123});
    $httpBackend.flush();


    $interval.flush(1000);
    $interval.flush(1000);
    $httpBackend.expectPOST('/api/track_charge/stop', data).respond({"resp":"ok"});
    $interval.flush(1000);

    $httpBackend.flush();
  });
});


