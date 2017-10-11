'use strict';

function promocionesController(CONFIG, $http, $window, loginService, $state) {
  var promoVm = this;
  var page = 0;
  var limit = CONFIG.page_limit || 10;

  promoVm.promociones = [];
  promoVm.hasMoreData = true;

  promoVm.nextPage = nextPage;
  promoVm.goToPromotion = goToPromotion;

  init();

  return promoVm;

  function init() {
    promoVm.nextPage();
  }

  function nextPage() {
    page += 1;
    var access_token = loginService.getUser()['accessToken'];

    var headers = {
      'Authorization': 'Bearer ' + access_token
    };

    return $http.get(_.join([CONFIG.promociones_url, page, limit], '/'), {headers: headers}).then(function(r) {
      promoVm.totalPages = r.data.totalPages;
      promoVm.hasMoreData = page < promoVm.totalPages;
      promoVm.promociones = promoVm.promociones.concat(r.data.results);
    });
  }

  function goToPromotion (promotion) {
    $window.localStorage.setItem('promotion', JSON.stringify(promotion));
    $state.go('promotion-detail', {promotionId: promotion._id})
  }
}

angular.module('app.controllers')
  .controller('PromocionesController', promocionesController);
