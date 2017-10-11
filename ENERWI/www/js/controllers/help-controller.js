'use strict';

function helpController ($rootScope, $state, loginService, $window){
  var helpVm = this;

  helpVm.start = start;
  helpVm.skipHelp = skipHelp;

  helpVm.title = '<i class="icon ion-android-home"></i>';
  helpVm.slideChanged = slideChanged;

  helpVm.slides = {
    currentSlide: 0
  };

  init();
  return helpVm;

  function init(){ }

  function slideChanged (index) {
    helpVm.slideIndex = index;
  };

  function start () {
    if(loginService.isSignedIn()) {
      $state.go('home');
    } else {
      $state.go('login');
    }
  }

  function skipHelp () {
    $window.localStorage.setItem('skipHelp', true);
    start();
  }
}

angular.module('app.controllers')
  .controller('HelpCtrl', helpController);
