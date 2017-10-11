'use strict';

describe('<Unit Test> promocionesController', function () {
  var $window, $httpBackend, geoService, $scope,
    $controller, promocionesController, CONFIG;

  var json = {"total":1,"results":[{"_id":"58028e088850eb158582133c","name":"Jueves 2x1","description":"Jueves 2x1 en alitas","store_id":"5801536e8850eb1585821339","fecha_exp":"2016-10-14T21:56:28.565Z","state":"activo"}],"currentPage":1,"totalPages":1,"pages":[1],"previous":false,"next":false,"first":1,"last":1};

  beforeEach(module('app.controllers'));

  beforeEach(function () {
    module('app.controllers', function ($provide) {
      $provide.factory('$window', function () {
        return {
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

      $provide.service('$cordovaDevice', function () {
        return {
          getUUID: function(){ return "ideDevice";}
        };
      });

      $provide.service('loginService', function () {
        return {
          getUser: function(){
            return {"user_id":"102353903095411604358","name":"Pancho villa","email":"pancho@gmail.com","image":"https://l/photo.jpg","accessToken":"atolen"}
          }
        };
      });

      $provide.service('geoService', function ($q) {
        return {
          getLastLocation: function(){
            return {};
          },
          isUserInStorePoint: function() {
            return $q.when(false);
          }
        };
      });

      $provide.service('$state', function () {
        return {
          go: function () {

          }
        };
      });
    });

    module('app.constants', function ($provide) {
      $provide.constant('CONFIG', {
        promociones_url: '/api/promociones',
        check_location_time: 1000
      });
    });
  });

  beforeEach(inject(function (_$window_, _$controller_, _$httpBackend_, _geoService_, $rootScope, _CONFIG_) {
    $window = _$window_;
    $controller = _$controller_;
    $httpBackend = _$httpBackend_;
    geoService = _geoService_;
    $scope = $rootScope.$new();
    promocionesController = $controller('PromocionesController', {$scope: $scope});
    CONFIG = _CONFIG_;
    $httpBackend.expectGET(CONFIG.promociones_url + '/1/10').respond(json);
    $httpBackend.flush();
  }));

  afterEach(function() {
      $httpBackend.verifyNoOutstandingExpectation();
      $httpBackend.verifyNoOutstandingRequest();
  });

  it('should init the controller', function () {
    expect(promocionesController).toBeDefined();
  });

  it('should call the backend right after init', function(){
    expect(promocionesController.promociones.length).toBe(1);
  });

  it('should increment the page after nextPage', function(){
    $httpBackend.expectGET(CONFIG.promociones_url + '/2/10').respond(json);
    promocionesController.nextPage();
    $httpBackend.flush();
  });

});
