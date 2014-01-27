'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies']);

app.config(function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/nes');

    $stateProvider
        .state('login', { url: '/login', templateUrl: 'app/account/login.html', controller: 'LoginCtrl'})
        .state('admin', {
            url: '/admin',
            templateUrl: 'app/admin/index.html',
            resolve: { loggedin: validateUser },
            controller: 'AdminCtrl'
        })
        .state('user', { url: '/user/:userName/:consoleId', templateUrl: 'app/game/userlist.html', controller: 'UserGameListCtrl' })
        .state('console', { url: '/:consoleId', templateUrl: 'app/game/masterlist.html', controller: 'GameListCtrl' })
        .state('console.game', {
            url: '/{gameId:[A-z0-9]{32}}',
            controller: 'GameDetailsCtrl'
        });

    //$httpProvider.interceptors.push('authInterceptor');
});

var validateUser = function ($q, $http, $location, $timeout) {
    var deferred = $q.defer();
    $http.get('/api/loggedin')
        .success(function (res) {
            if (res.status) {
                $timeout(function () { deferred.resolve(); }, 0);
            } else {
                $timeout(function () { deferred.reject(); }, 0);
                $location.path('/login');
            }
        });
};

app.factory('GamesService', function ($resource, $location) {
    return $resource('/api/:consoleId');
});

app.factory('UserGamesService', function ($resource) {
    return $resource('/api/user/:userName/:consoleId');
});

app.factory('GameDetailsService', function($resource) {
  return $resource('/api/:consoleId/:gameId');
});

app.constant('consoles', [
	{'id': 'nes', 'name': 'NES'}, 
	{ 'id': 'snes', 'name': 'SNES' },
    { 'id': 'n64', 'name': 'GB' },
    { 'id': 'n64', 'name': 'N64' },
    { 'id': 'gc', 'name': 'GC' }]);

app.constant('baseRegions', [
  {'id': 'scn', 'name': 'SCN+ESP', 'selected': true},
  {'id': 'pal-b', 'name': 'PAL-B', 'selected': true},
  {'id': 'pal-a', 'name': 'PAL-A', 'selected': true},
  {'id': 'ntsc', 'name': 'NTSC', 'selected': true},
  ]);

app.filter('codeFilter', function($filter){
    return function (games, filters) {
        var r = [], c = [];
        if (games) {
            c = getChecked(filters);
            _.each(games, function (g) {
                if (_.intersection(g.regions, c).length) {
                    r.push(g);
                }
            });
        }
        return r;
    };

  function getChecked(f){
    var c = [];
    for(var k in f){
      if(f[k]){
        c.push(k);
      } 
    }
    return c;
  }
});