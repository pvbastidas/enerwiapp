'use strict';

function loginController (loginService, $state, $rootScope, notificationService, $window, $ionicSideMenuDelegate) {
  var lc = this;

  lc.login = login;
  lc.legacylogin = legacylogin;
  lc.register = register;
  lc.checkForm = checkForm;

  init();
  resetValues();
  return lc;

  function init(){
    $ionicSideMenuDelegate.canDragContent(false)
  }

  function login (isFacebook) {

    if (!loginService.isSignedIn()) {
      var promise = isFacebook ? loginService.loginWithFacebook() : loginService.login();
      promise.then(function (data) {
        $rootScope.$emit('login:success');
        if(!$window.localStorage.getItem('skipHelp')) {
          $state.go('help');
        } else {
          $state.go('home');
        }
      },
      function(error) {
        notificationService.addNotification('Por favor intente de nuevo.', 'danger');
      });
    } else {
      $state.go('home');
    }
  }

  function register(){
    var user = {
      name: lc.name + ' ' + lc.lastname,
      email: lc.email,
      password: lc.password
    };

    loginService.register(user).then(function(){
      $rootScope.$emit('login:success');
      notificationService.addNotification('Usuario registrado... accediendo');
      $state.go('home');
    },
    function(error) {
      if (error.data && error.data.error) {
        notificationService.addNotification(error.data.error, 'danger');
      } else {
        notificationService.addNotification('Error creando cuenta', 'danger');
      }
    });
  }

  function legacylogin(){
    var user = {
      email: lc.email,
      password: lc.password
    };

    loginService.legacylogin(user).then(function(){
      $rootScope.$emit('login:success');
      $state.go('home');
    },
    function(error) {
      if (error.data && error.data.error) {
        notificationService.addNotification(error.data.error, 'danger');
      } else {
        notificationService.addNotification('Error al ingresar, por favor intente de nuevo.', 'danger');
      }
    });
  }

  function checkForm() {
    return !(lc.password && lc.password !== '' && lc.password === lc.password2) || lc.registerform.$invalid;
  }

  function resetValues () {
    lc.name = '';
    lc.lastname = '';
    lc.email = '';
    lc.password = '';
    lc.password2 = '';
  }
}

angular.module('app.controllers')
.controller('LoginController', loginController);
