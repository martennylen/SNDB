'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies', 'infinite-scroll']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$urlRouterProvider', '$stateProvider',
    function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
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
                stats: ['UserGamesStatsService', '$stateParams', function (UserGamesStatsService, $stateParams) {
                    var stats = UserGamesStatsService.query({ userName: $stateParams.userName });
                    return stats.$promise;
                }]
            }
        })
        .state('user.list', {
            url: '/:consoleName', templateUrl: 'app/user/userlist.html', controller: 'UserListCtrl'
            //resolve: {
            //    gameResponse: ['UserGamesService', '$stateParams', function (UserGamesService, $stateParams) {
            //        var games = UserGamesService.get({ userName: $stateParams.userName, consoleName: $stateParams.consoleName });
            //        return games.$promise;
            //    }]
            //}
        })
        .state('user.region', {
            url: '/:consoleName/:regionName', templateUrl: 'app/user/userlist.html', controller: 'UserListCtrl'
            //resolve: {
            //    gameResponse: ['UserGamesRegionService', '$stateParams', function (UserGamesRegionService, $stateParams) {
            //        var games = UserGamesRegionService.get({ userName: $stateParams.userName, consoleName: $stateParams.consoleName, regionName: $stateParams.regionName });
            //        return games.$promise;
            //    }]
            //}
        })
        .state('user.subRegion', {
            url: '/:consoleName/:regionName/:subRegionName', templateUrl: 'app/user/userlist.html', controller: 'UserListCtrl'
        })
        .state('console', {
            abstract: true, url: '/:consoleName', template: '<ui-view/>'
        })
        .state('console.region', {
            url: '/:regionName', templateUrl: 'app/game/regionlist.html', controller: 'GameRegionCtrl'
            //resolve: {
            //    stats: function (GamesStatsService) {
            //        var games = GamesStatsService.get({ level: 1 });
            //        return games.$promise;
            //    }
            //}
        })
        .state('console.region.subregion', {
            url: '/:subRegionName', templateUrl: 'app/game/masterlist.html', controller: 'GameListCtrl'
        })
        .state('game', {
            //url: '/:consoleId/{gameId:[A-z0-9]{32}}',
            url: '/:consoleName/:regionName/:subRegionName/:gameName',
            templateUrl: 'app/game/game.html',
            controller: 'GameDetailsCtrl'
        });
}]);

var validateUser = ['$q', '$http', '$location', '$timeout', function($q, $http, $location, $timeout) {
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
}];

app.factory('GamesStatsService', ['$resource', function ($resource) {
    return $resource('/api/stats');
}]);

app.factory('UserGamesStatsService', ['$resource', function ($resource) {
    return $resource('/api/user/:userName/:consoleName/:regionName/:subRegionName');
}]);

app.factory('GamesService', ['$resource', function ($resource) {
    return $resource('/api/:consoleName/:regionName/:subRegionName');
}]);

app.factory('GameDetailsService', ['$resource', function ($resource) {
    return $resource('/api/:consoleName/:regionName/:subRegionName/:gameName');
}]);

app.constant('consoles', [
	{'id': 'nes', 'name': 'NES'}, 
	{ 'id': 'snes', 'name': 'SNES' },
    { 'id': 'n64', 'name': 'GB' },
    { 'id': 'n64', 'name': 'N64' },
    { 'id': 'gc', 'name': 'GC' },
    { 'id': 'wii', 'name': 'Wii' },
    { 'id': 'wiiu', 'name': 'WiiU' },
    { 'id': 'gw', 'name': 'G&W' }
]);

app.constant('baseRegions', [
    {
        id: 'pal-b', name: 'PAL-B', selected: true, regions:
        [
            { id: 'scn', name: 'SCN', selected: true },
            { id: 'noe', name: 'NOE', selected: false },
            { id: 'esp', name: 'ESP', selected: false },
            { id: 'fra', name: 'FRA', selected: false },
            { id: 'hol', name: 'HOL', selected: false }
        ]
    },
    {
        id: 'pal-a', name: 'PAL-A', selected: false, regions:
        [
            { id: 'ukv', name: 'UKV', selected: true },
            { id: 'ita', name: 'ITA', selected: false },
            { id: 'aus', name: 'AUS', selected: false }
        ]
    },
    {
        id: 'ntsc', name: 'NTSC', selected: false, regions:
        [
            { id: 'ntsc', name: 'NTSC', selected: true }
        ]
    },
    {
        id: 'ntsc-j', name: 'NTSC-J', selected: false, regions:
        [
            { id: 'ntsc-j', name: 'NTSC-J', selected: true }
        ]
    }
  ]);

//app.filter('codeFilter', function($filter){
//    return function (games, filters) {
//        var r = [], c = [];
//        if (games) {
//            c = getChecked(filters);
//            _.each(games, function (g) {
//                if (_.intersection(g.regions, c).length) {
//                    r.push(g);
//                }
//            });
//        }
//        return r;
//    };

//  function getChecked(f){
//    var c = [];
//    for(var k in f){
//      if(f[k]){
//        c.push(k);
//      } 
//    }
//    return c;
//  }
//});

_.mixin(_.str.exports());