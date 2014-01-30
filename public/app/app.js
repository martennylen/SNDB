'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies']);

app.config(function($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/nes');

    $stateProvider
        .state('login', { url: '/login', templateUrl: 'app/account/login.html', controller: 'LoginCtrl' })
        .state('register', { url: '/register', templateUrl: 'app/account/register.html', controller: 'RegisterCtrl' })
        .state('admin', {
            url: '/admin',
            templateUrl: 'app/admin/index.html',
            controller: 'AdminCtrl',
            resolve: { user: validateUser }
        })
        .state('user', {
            //abstract: true,
            url: '/user/:userName',
            templateUrl: 'app/user/user.html',
            controller: 'UserCtrl',
            resolve: {
                stats: function (UserGamesStatsService, $stateParams) {
                    var stats = UserGamesStatsService.query({ userName: $stateParams.userName });
                    return stats.$promise;
                }
            }
        })
        .state('user.list', {
            url: '/:consoleName', templateUrl: 'app/user/userlist.html', controller: 'UserListCtrl',
            resolve: {
                gameResponse: function (UserGamesService, $stateParams) {
                    var games = UserGamesService.get({ userName: $stateParams.userName, consoleName: $stateParams.consoleName });
                    return games.$promise;
                }
            }
        })
        .state('game', {
            //url: '/:consoleId/{gameId:[A-z0-9]{32}}',
            url: '/:consoleName/:gameName',
            templateUrl: 'app/game/game.html',
            controller: 'GameDetailsCtrl'
        })
        .state('console', { url: '/:consoleName', templateUrl: 'app/game/masterlist.html', controller: 'GameListCtrl' });
});

var validateUser = function($q, $http, $location, $timeout) {
    var deferred = $q.defer();
    $http.get('/api/loggedin')
        .success(function(res) {
            if (res.status) {
                $timeout(function() {deferred.resolve(res.user);}, 0);
            } else {
                $timeout(function() {deferred.reject();}, 0);
                $location.path('/nes');
            }
        });

    return deferred.promise;
};

app.factory('UserGamesStatsService', function ($resource) {
    return $resource('/api/user/:userName');
});

app.factory('UserGamesService', function ($resource) {
    return $resource('/api/user/:userName/:consoleName');
});

app.factory('GameDetailsService', function ($resource) {
    return $resource('/api/:consoleName/:gameName');
});

app.factory('GamesService', function ($resource, $location) {
    return $resource('/api/:consoleName');
});

app.constant('consoles', [
	{'id': 'nes', 'name': 'NES'}, 
	{ 'id': 'snes', 'name': 'SNES' },
    { 'id': 'n64', 'name': 'GB' },
    { 'id': 'n64', 'name': 'N64' },
    { 'id': 'gc', 'name': 'GC' },
    { 'id': 'wii', 'name': 'Wii' },
    { 'id': 'gc', 'name': 'WiiU' },
    { 'id': 'gw', 'name': 'G&W' }
]);

app.constant('baseRegions', [
  {'id': 'scn', 'name': 'SCN+ESP', 'selected': true},
  {'id': 'pal-b', 'name': 'PAL-B', 'selected': true},
  {'id': 'pal-a', 'name': 'PAL-A', 'selected': true},
  {'id': 'ntsc', 'name': 'NTSC', 'selected': true}
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