'use strict';

//var app = angular.module('sndb', ['ngResource', 'ngRoute']);
var app = angular.module('sndb', ['ngResource', 'ngRoute', 'ui.router', 'ngCookies']);

app.config(function ($httpProvider, $routeProvider, $locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        //.when('/admin', { templateUrl: 'app/views/admin/index.html', controller: 'AdminCtrl' })
        //.otherwise({ redirectTo: '/nes' });
    .when('', '/nes');
    //      .when('/:consoleId', { templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
    //      .when('/:consoleId/user/:userId', { templateUrl: 'app/views/users_games.html', controller: 'CombinedListCtrl' })
    //      .when('/:consoleId/:gameId', { templateUrl: 'app/views/game.html', controller: 'GameDetailsCtrl' })
    //      .otherwise({ redirectTo: '/nes' });

    $stateProvider
        .state('login', { url: '/login', templateUrl: 'app/views/login.html', controller: 'LoginCtrl'})
        .state('admin', {
            url: '/admin',
            templateUrl: 'app/views/admin/index.html',
            resolve: { loggedin: validateUser },
            controller: 'AdminCtrl'
        })
        .state('user', { url: '/user/:userId/:consoleId', templateUrl: 'app/views/users_games.html', controller: 'CombinedListCtrl' })
        .state('console', { url: '/:consoleId', templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
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

//app.config(function ($httpProvider) {
//    $httpProvider.interceptors.push(function ($rootScope, $location, $q) {
//        return {
//            'request': function (request) {
//                // if we're not logged-in to the AngularJS app, redirect to login page
//                $rootScope.loggedIn = $rootScope.loggedIn && _.contains($rootScope.roles, 'a');
//                if (!$rootScope.loggedIn && $location.path() === '/admin') {
//                    $location.path('/login');
//                }
//                return request;
//            },
//            'responseError': function (rejection) {
//                // if we're not logged-in to the web service, redirect to login page
//                if (rejection.status === 401 && $location.path() != '/login') {
//                    $rootScope.loggedIn = false;
//                    $location.path('/login');
//                }
//                return $q.reject(rejection);
//            }
//        };
//    });
//});

app.factory('GamesService', function ($resource, $location) {
    return $resource('/api/:consoleId');
});

app.factory('CombinedGamesService', function ($resource) {
    return $resource('/api/user/:userId/:consoleId');
});

app.factory('GameDetailsService', function($resource) {
  return $resource('/api/:consoleId/:gameId');
});


//app.factory('authInterceptor', function ($location, $rootScope, $q, $cookieStore) {
//    return {
//        request: function (config) {
//            config.headers = config.headers || {};
//            console.log($location.path());
//            return config;
//        },
//        response: function (response) {
//            console.log(response.status);
//            if (response.status === 401) {
//                console.log('apa');
//            }
//            return response || $q.when(response);
//        }
//    };
//});

app.constant('consoles', [
	{'id': 'nes', 'name': 'NES'}, 
	{'id': 'snes', 'name': 'SNES'}]);

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

app.controller('IndexCtrl', function($scope, consoles, $http, $rootScope){
    $scope.consoles = consoles;
    console.log('index');
    $http.get('/api/user/details').success(function (user) {
        console.log('men va fan: ' + JSON.stringify(user));
        if (!_.isEmpty(user)) {
            $rootScope.loggedInUser = user.username;
        }
    });
    //$scope.loggedInUser = $cookieStore.get('trackr.sess').username || {};
});

app.controller('AdminCtrl', function ($scope, $http, $location, consoles, baseRegions) {
  $scope.user = 'Mårten';
  $scope.consoles = consoles;
  $scope.regions = _.map(baseRegions, function (r) { r.selected = false; return r; });
  $scope.game = {};
  $scope.game.regions = [];
  $scope.postMessage = '';

  $scope.addRegion = function(r){
    if(r.selected){
      $scope.game.regions.push(r.id);
    }
    else {
      $scope.game.regions.splice(_.indexOf($scope.game.regions, r.id), 1);
    }
  };

	$scope.addGame = function(game){
	    $http.post('/api/newgame', game).
		success(function (response) {
		    if (response.reply === 'ok') {
		        $scope.postMessage = 'Spel sparat';
		    }
		}).
		error(function (id) {
		    console.log('server response failed');
		});
	};
});

app.controller('GameListCtrl', function ($scope, $location, $route, $stateParams, GamesService, GameDetailsService, baseRegions) {
    console.log('gamelistctrl');
    $scope.console = $stateParams.consoleId || 'nes';
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
      $scope.filterBoxes[f.id] = f.selected;
    });
    
    $scope.games = GamesService.query({ consoleId: $scope.console });
    $scope.games.$promise.then(function (games) {
        $scope.games = games;
    });
});

app.controller('CombinedListCtrl', function ($scope, $location, $route, $state, $stateParams, CombinedGamesService, baseRegions) {
    console.log('comblistctrl');
    $scope.console = $stateParams.consoleId || 'nes';
    $scope.userId = $stateParams.userId;
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });
    
    $scope.games = CombinedGamesService.query({ consoleId: $scope.console, userId: $scope.userId });
    $scope.games.$promise.then(function (games) {
        $scope.games = games;
    });

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        $scope.isEditing = !$scope.isEditing;
        if ($scope.isEditing) {
            $scope.selected.id = g;
        } else {
            if ($scope.selected.id !== g) {
                $scope.selected.id = g;
                $scope.isEditing = true;
            } else {
                $scope.selected.id = '';
            }
        }
    };
});

app.controller('GameDetailsCtrl', function ($scope, $stateParams, GameDetailsService) {
    console.log('gamedetailsctrl');
    //if (!$stateParams.gameId.length) {
    //    return;
    //}
    $scope.selected.id = $stateParams.gameId;
    $scope.games.$promise.then(function (result) {
        $scope.games = result;
        var current = _.find($scope.games, function (g) {
            return g.id === $scope.selected.id;
        });

        if (!current.content) {
            GameDetailsService.query({ consoleId: $stateParams.consoleId, gameId: $stateParams.gameId }, function (game) {
                console.log('hämtar');
                current.content = game[0].value.releaseDate;
            });
        }
    });
});

app.controller('LoginCtrl', function ($scope, $location, $http, $rootScope) {
    console.log('loginctrl');

    $scope.credentials = {};

    $scope.validateCredentials = function (data) {
        $http.post('/api/login', data).
		success(function (response) {
		    if (response.success) {
		        $rootScope.loggedInUser = response.user.username;
		        $location.path('/user/' + response.user.username + '/nes');
		    } else {
		        $scope.errorMessage = response.message;
		    }
		}).
		error(function (response) {
		    console.log(response);
		});
    };
});

app.controller('LogoutCtrl', function ($scope, $location, $http, $rootScope) {
    $scope.logout = function () {
        $http.post('/api/logout').
            success(function (response) {
                $rootScope.loggedInUser = '';
                $location.path('/');
            });
    };
});