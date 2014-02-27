'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies', 'infinite-scroll']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$urlRouterProvider', '$stateProvider',
    function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/nes/');

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
                templateUrl: 'app/user/header.html',
                controller: 'UserHeaderCtrl',
                resolve: {
                    stats: ['BazingaService', '$stateParams', '$q', function (BazingaService, $stateParams, $q) {
                        var deferred = $q.defer();
                        BazingaService.query({ userName: $stateParams.userName, level: 2 }).$promise.then(function (consoles) {
                            return $q.all(_.map(consoles, function (c) {
                                return BazingaService.query({ userName: $stateParams.userName, consoleName: c.id, level: 3 }).$promise.then(function (regions) {
                                    c.regions = regions;
                                    return $q.all(_.map(regions, function (r) {
                                        return BazingaService.query({ userName: $stateParams.userName, consoleName: c.id, regionName: r.id, level: 4 }).$promise.then(function (subRegions) {
                                            r.subRegions = subRegions;
                                            return subRegions;
                                        });
                                    })).then(function (allSubRegions) {
                                        return regions;
                                    });
                                });
                            })).then(function (allRegions) {
                                return consoles;
                            });
                        }).then(function (consoles) {
                            deferred.resolve(consoles);
                        });
                        return deferred.promise;
                    }],
                    attrs: ['UserAttrService', '$stateParams', '$q', function (UserAttrService, $stateParams, $q) {
                        var deferred = $q.defer();
                        UserAttrService.query({ userName: $stateParams.userName, level: 2 }).$promise.then(function (data) {
                            deferred.resolve(data);
                        });

                        return deferred.promise;
                    }]
                }
            })
            .state('user.region', {
                url: '/:consoleName/:regionName',
                templateUrl: 'app/user/user.html',
                controller: 'UserCtrl'
            })
            .state('user.region.subRegion', {
                url: '/:subRegionName',
                templateUrl: 'app/user/userlist.html',
                controller: 'UserListCtrl'
            })
            //.state('user.list', {
            //    url: '/:regionName',
            //    templateUrl: 'app/user/userlist.html',
            //    controller: 'UserListCtrl'
            //})
            //.state('user.subRegion', {
            //    url: '/:subRegionName',
            //    templateUrl: 'app/user/userlist.html',
            //    controller: 'UserListCtrl'
            //})
            .state('console', {
                url: '/:consoleName', templateUrl: 'app/game/header.html', controller: 'HeaderCtrl',
                resolve: {
                    consoles: ['GameStructureService', function (GameStructureService) {
                        return GameStructureService;
                    }]
                }
            })
            .state('console.region', {
                url: '/:regionName',
                templateUrl: 'app/game/regionlist.html',
                controller: 'GameRegionCtrl'
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

app.factory('GameStructureService', ['GamesStatsService', '$q', function (GamesStatsService, $q) {
    var deferred = $q.defer();
    GamesStatsService.query({ level: 1 }).$promise.then(function (consoles) {
        return $q.all(_.map(consoles, function (c) {
            return GamesStatsService.query({ consoleName: c.id, level: 2 }).$promise.then(function (regions) {
                c.regions = regions;
                return $q.all(_.map(regions, function (r) {
                    return GamesStatsService.query({ consoleName: c.id, regionName: r.id, level: 3 }).$promise.then(function (subRegions) {
                        r.subRegions = subRegions;
                        return subRegions;
                    });
                })).then(function (allSubRegions) {
                    return regions;
                });
            });
        })).then(function (allRegions) {
            return consoles;
        });
    }).then(function (consoles) {
        deferred.resolve(consoles);
    });
    
    return deferred.promise;
}]);

app.factory('GamesStatsService', ['$resource', function ($resource) {
    return $resource('/api/stats');
}]);

app.factory('UserGamesService', ['$resource', function ($resource) {
    return $resource('/api/user/:userName/:consoleName/:regionName/:subRegionName');
}]);

app.factory('UserAttrService', ['$resource', function($resource) {
    return $resource('/api/user/stats/attrs/:userName');
}]);

app.factory('BazingaService', ['$resource', function ($resource) {
    return $resource('/api/user/stats/:userName');
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