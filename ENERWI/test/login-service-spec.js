'use strict';

describe('<Unit Test> loginService', function () {

  var $cordovaOauth, $scope, $httpBackend, $window, loginService, $state;

  beforeEach(module('app.services'));


  beforeEach(function () {
    module('app.services', function ($provide) {
      $provide.factory('$cordovaOauth', function ($q) {
        return {
          google: function () {
          },
          facebook: function () {
          }
        }
      });

       $provide.factory('$state', function () {
        return {
          go: function () {
          }
        }
      });
    });

    module('app.constants', function ($provide) {
      $provide.constant('CONFIG', {
        client_id_google: 'test',
        google_apis: 'test',
        login_url: '/api/login'
      });
    });

  });

  beforeEach(inject(function (_$cordovaOauth_, $rootScope, _$httpBackend_, _$window_, _loginService_, _$state_) {
    $scope = $rootScope.$new();
    $cordovaOauth = _$cordovaOauth_;
    $httpBackend = _$httpBackend_;
    $window = _$window_;
    $state = _$state_;

    loginService = _loginService_;
  }));

  it('should init the service', function () {
    expect(loginService).toBeDefined();
  });

  it('should call to $cordovaOauth google', inject(function ($q) {
    spyOn($cordovaOauth, 'google').and.returnValue($q.when({access_token: '1234'}));

    loginService.login(false);

    expect($cordovaOauth.google).toHaveBeenCalled();
  }));

  it('should call to $cordovaOauth facebook', inject(function ($q) {
    spyOn($cordovaOauth, 'facebook').and.returnValue($q.when({access_token: '1234'}));

    loginService.login(true);

    expect($cordovaOauth.facebook).toHaveBeenCalled();
  }));

  it('should call to login api and save the user in the local storage (facebook)', inject(function ($q) {
    var access_token = '1234';
    var user = {name: 'Pancho Villa', email: 'pancho@gmail.com'};

    spyOn($window.localStorage, 'setItem')

    spyOn($cordovaOauth, 'facebook').and.returnValue($q.when({access_token: access_token}));
    $httpBackend.expectPOST('/api/login', {access_token: access_token, isFacebook: true, bearer_token: null}).respond(user);

    loginService.login(true);

    $scope.$digest();
    $httpBackend.flush();

    expect($window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  }));


  it('should call to login api and save the user in the local storage (google)', inject(function ($q) {
    var access_token = '1234';
    var bearer_token = '987';
    var user = {name: 'Pancho Villa', email: 'pancho@gmail.com'};

    spyOn($window.localStorage, 'setItem')

    spyOn($cordovaOauth, 'google').and.returnValue($q.when({id_token: access_token, access_token: bearer_token}));
    $httpBackend.expectPOST('/api/login', {access_token: access_token, isFacebook: false, bearer_token: bearer_token}).respond(user);

    loginService.login(false);

    $scope.$digest();
    $httpBackend.flush();

    expect($window.localStorage.setItem).toHaveBeenCalledWith('user', JSON.stringify(user));
  }));

  it('should go to login if the route requires auth', function () {
    spyOn($state, 'go')

    loginService.routeRequiresLogin('/home');

    expect($state.go).toHaveBeenCalledWith('login');
  });

  it('should not redirect to login if the route is login', function () {
    spyOn($state, 'go')

    loginService.routeRequiresLogin('/login');

    expect($state.go).not.toHaveBeenCalledWith('login');
  });

  it('should not redirect to login if the route is register', function () {
    spyOn($state, 'go')

    loginService.routeRequiresLogin('/register');

    expect($state.go).not.toHaveBeenCalledWith('login');
  });

  it('should not redirect to login if the route is legacylogin', function () {
    spyOn($state, 'go')

    loginService.routeRequiresLogin('/legacylogin');

    expect($state.go).not.toHaveBeenCalledWith('login');
  });
});
