'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies', 'infinite-scroll']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$urlRouterProvider', '$stateProvider',
    function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/nes/');

        $stateProvider
            .state('login', { url: '/login', templateUrl: 'app/account/login.html', controller: 'LoginCtrl' })
            .state('register', { url: '/register', templateUrl: 'app/account/register.html', controller: 'RegisterCtrl' })
            .state('admin', { url: '/admin', templateUrl: 'app/admin/header.html', controller: 'AdminHeaderCtrl', resolve: { user: validateUser } })
            .state('admin.index', {
                url: '/index',
                templateUrl: 'app/admin/index.html',
                controller: 'AdminCtrl',
                resolve: { user: validateUser }
            })
            .state('admin.register', {
                url: '/register',
                templateUrl: 'app/admin/register.html',
                controller: 'RegisterCtrl',
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

app.factory('SearchService', ['$timeout', '$http', function ($timeout, $http) {
    var latestResults = [];
    var searchResults = [];
    var self = this;
    
    self.search = function ($scope) {
        if ($scope.q === undefined) {
            return;
        }

        if ($scope.q.length === 0) {
            if (self.internal) {
                $scope.games = [];
            } else {
                $scope.$broadcast('searchResult', null, false);
            }
            return;
        }

        var oldies = _.filter(latestResults, function (game) {
            return _.any(game.tags, function (tag) {
                return _(tag).startsWith($scope.q);
            });
        });

        if (oldies.length === 0) {
            searchThrottled($scope);
        } else {
            if (internal) {
                $scope.games = oldies;
            } else {
                $scope.$broadcast('searchResult', oldies, true);
            }
        }
    };

    var searchDelayed = function ($scope) {
        $scope.$apply(function () { searchAction($scope); });
    };

    var searchThrottled = _.debounce(searchDelayed, 1000);

    var searchAction = function ($scope) {
        if ($scope.q !== undefined && $scope.q.length) {
            console.log('eller så söker vi lite...');

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get('/api/search/' + $scope.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase() + '&r=' + $scope.userName);
                $scope.pendingPromise
                .success(function (res) {
                    latestResults = res.games;
                    
                    searchResults = _.filter(res.games, function (game) {
                        return _.any(game.data.tags, function (tag) {
                            return _(tag).startsWith($scope.q.toLowerCase());
                        });
                    });

                    if (self.internal) {
                        $scope.games = searchResults;
                    } else {
                        $scope.$broadcast('searchResult', searchResults, true);
                    }
                    console.log('och nu kom resultatet');
                });
            }, 0);
        }
    };

    return {
        Search: function($scope) {
            return self.search($scope);
        },
        SearchInternal: function ($scope) {
            self.internal = true;
            return self.search($scope);
        }
    };
}]);

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
    { 'id': 'gb', 'name': 'GB' },
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

_.mixin(_.str.exports());