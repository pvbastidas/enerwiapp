'use strict';
angular.module('app.services')
.service('loginService', function ($cordovaOauth, $q, $window, $http, CONFIG, $state, $cordovaFacebook) {

  return {
    isSignedIn: isSignedIn,
    login: login,
    getUser: getUser,
    logout: logout,
    register: register,
    legacylogin: legacylogin,
    routeRequiresLogin: routeRequiresLogin,
    loginWithFacebook: loginWithFacebook
  };


  function login () {
    var deferred = $q.defer();

    var oauthApi = $cordovaOauth.google(CONFIG.client_id_google, CONFIG.google_apis);

    oauthApi
    .then(function (resp) {
      var access_token = resp.id_token,
          bearer_token = resp.access_token;

      return $http.post(CONFIG.login_url, {access_token: access_token, isFacebook: false, bearer_token: bearer_token});
    })
    .then(function(result) {
      $window.localStorage.setItem('user', JSON.stringify(result.data));
      deferred.resolve();
    },
    function(error) {
      deferred.reject(error);
    });

    return deferred.promise;
  }

  function loginWithFacebook () {
    var deferred = $q.defer();
    var user = {};

    $cordovaFacebook.login(['public_profile', 'email', 'user_friends'])
      .then(function (resp) {
        var access_token = resp.authResponse.accessToken;

        return $http.post(CONFIG.login_url, {access_token: access_token, isFacebook: true, bearer_token: null});
      })
      .then(function(result) {
        user = result.data;
        return $http.get(CONFIG.base_url + '/update_image/' + user.user_id);
      })
      .then(function(res) {
        if (res.data && res.data.imageUrl) {
          user.image = res.data.imageUrl;
        }

        $window.localStorage.setItem('user', JSON.stringify(user));
        deferred.resolve();
      },
      function(error) {
        console.log('Error >', JSON.stringify(error));
        deferred.reject(error);
      });

      return deferred.promise;
  }


  function logout () {
    $window.localStorage.removeItem('user');
  };

  function isSignedIn () {
    return !!$window.localStorage.getItem('user');
  }

  function getUser () {
    return JSON.parse($window.localStorage.getItem('user'));
  }

  function register (user) {
    return $http.post(CONFIG.register_url, user)
      .then(function(result) {
        $window.localStorage.setItem('user', JSON.stringify(result.data));
      });
  }

  function legacylogin (user) {
    return $http.post(CONFIG.legacylogin_url, user)
      .then(function(result){
        $window.localStorage.setItem('user', JSON.stringify(result.data));
      });
  }

  function routeRequiresLogin(currentRoute) {
    if (!(/login/i.test(currentRoute)) && !(/register/i.test(currentRoute)) && !(/legacylogin/i.test(currentRoute))) {
      $state.go('login');
    }
  }
});
