'use strict';

var app = angular.module('trackr', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies', 'infinite-scroll']);

app.config(['$httpProvider', '$routeProvider', '$locationProvider', '$urlRouterProvider', '$stateProvider',
    function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/start');

    $stateProvider
        .state('login', { url: '/login', templateUrl: 'app/account/login.html', controller: 'LoginCtrl' })
        .state('register', { url: '/register', templateUrl: 'app/account/register.html', controller: 'RegisterCtrl' })
        .state('admin', { url: '/admin', templateUrl: 'app/admin/header.html', controller: 'AdminHeaderCtrl', resolve: { user: validateUser } })
        .state('start', {
            url: '/start',
            templateUrl: 'app/start/index.html',
            controller: 'StartCtrl',
            resolve: {
                stats: function($q, $resource){
                    var deferred = $q.defer();
                    $resource('/api/start/stats').get().$promise.then(function (data) {
                        deferred.resolve(data);
                    });
                    return deferred.promise;
                }
            }
        })
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
                stats: function ($stateParams, $q, $resource) {
                    var deferred = $q.defer();
                    $resource('/api/user/stats/:userName').query({ userName: $stateParams.userName, level: 2 }).$promise.then(function (data) {
                        deferred.resolve(data);
                    });
                    return deferred.promise;
                },
                attrs: function ($stateParams, $q, $resource) {
                    var deferred = $q.defer();
                    $resource('/api/user/stats/attrs/:userName').query({ userName: $stateParams.userName, level: 2 }).$promise.then(function (data) {
                        deferred.resolve(data);
                    });

                    return deferred.promise;
                }
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
        .state('all', {
            url: '/all',
            templateUrl: 'app/game/header.html',
            controller: 'HeaderCtrl',
            resolve: {
                consoles: function ($q, $resource) {
                    var deferred = $q.defer();
                    $resource('/api/stats').query({ level: 1 }).$promise.then(function (data) {
                        deferred.resolve(data);
                    });

                    return deferred.promise;
                }
            }
        })
        .state('all.console', {
            url: '/:consoleName', template: '', controller: 'HeaderCtrl'
        })
        .state('all.region', {
            url: '/:consoleName/:regionName',
            templateUrl: 'app/game/regionlist.html',
            controller: 'GameRegionCtrl'
        })
        .state('all.region.subregion', {
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
                $location.path('/all/nes/');
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

            var request;
            if (self.internal) {
                request = '/api/admin/search/' + '?q=' + $scope.q.substring(0, 3).toLowerCase();
            } else {
                request = '/api/search/' + $scope.consoleName + '?q=' + $scope.q.substring(0, 3).toLowerCase();
                if ($scope.userName) {
                    request += '&r=' + $scope.userName;
                }
            }

            $timeout(function () {
                if ($scope.pendingPromise) { $timeout.cancel($scope.pendingPromise); }
                $scope.pendingPromise = $http.get(request);
                $scope.pendingPromise
                .success(function (res) {
                    console.log(res.games);
                    latestResults = res.games;
                    
                    searchResults = _.filter(res.games, function (game) {
                        return _.any(game.data.tags, function (tag) {
                            return _(tag).startsWith($scope.q.toLowerCase());
                        });
                    });

                    console.log(searchResults);

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

app.factory('UserGamesService', ['$resource', function ($resource) {
    return $resource('/api/user/:userName/:consoleName/:regionName/:subRegionName');
}]);

app.factory('GamesService', ['$resource', function ($resource) {
    return $resource('/api/:consoleName/:regionName/:subRegionName');
}]);

app.factory('GameDetailsService', ['$resource', function ($resource) {
    return $resource('/api/:consoleName/:regionName/:subRegionName/:gameName');
}]);

app.factory('GameDataService', ['$resource', function($resource) {
    return $resource('/api/game/:gameId');
}]);

app.constant('consoles', [
	{'id': 'nes', 'name': 'NES'}, 
	{ 'id': 'snes', 'name': 'SNES' },
    { 'id': 'gb', 'name': 'GB' },
    { 'id': 'gba', 'name': 'GBA' },
    { 'id': 'gbc', 'name': 'GBC' },
    { 'id': 'vb', 'name': 'VB' },
    { 'id': 'ds', 'name': 'DS' },
    { 'id': '3ds', 'name': '3DS' },
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
            { id: 'rev-a', name: 'REV-A', selected: true }
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