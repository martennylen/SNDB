'use strict';

//var app = angular.module('sndb', ['ngResource', 'ngRoute']);
var app = angular.module('sndb', ['ngResource', 'ngRoute', 'ui.router']);

app.config(function ($locationProvider, $urlRouterProvider, $stateProvider) {
    $urlRouterProvider
        .when('', '/nes');
        //    //.when('/:consoleId', { templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
        //.when('/:consoleId/user/:userId', { templateUrl: 'app/views/users_games.html', controller: 'CombinedListCtrl' })
        //    //.when('/:consoleId/:gameId', { templateUrl: 'app/views/game.html', controller: 'GameDetailsCtrl' })
        //.otherwise({ redirectTo: '/nes' });

    $stateProvider
        .state('admin', { url: '/admin', templateUrl: 'app/views/admin/index.html', controller: 'AdminCtrl' })
        .state('user', { url: '/user/:userId/:consoleId', templateUrl: 'app/views/users_games.html', controller: 'CombinedListCtrl' })
        //.state('user.game', {
        //    //abstract: true,
        //    //url: '/:gameId',
        //    url: '/{gameId:[A-z0-9]{32}}',//
        //    controller: 'GameDetailsCtrl'
        //    //views: { 'apa': { controller: 'GameDetailsCtrl' } },
        //    //controller: function($scope, $stateParams) {
        //    //    $scope.selected.id = $stateParams.gameId;
        //    //}
        //})
        .state('console', { url: '/:consoleId', templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
        .state('console.game', {
            url: '/{gameId:[A-z0-9]{32}}',
            controller: 'GameDetailsCtrl'
        });
    //.state('console.game.details', {
    //    url: '/details',
    //    controller: 'GameDetailsCtrl',
    //    templateUrl: 'app/views/game.content'
    //})
    //.state('console', { url: '/:consoleId', templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
});

//app.config(function ($stateProvider, $urlRouterProvider) {
//    $stateProvider
//      .state('/admin', { templateUrl: 'app/views/admin/index.html', controller: 'AdminCtrl' })
//      .when('/:consoleId', { templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl' })
//      .when('/:consoleId/user/:userId', { templateUrl: 'app/views/users_games.html', controller: 'CombinedListCtrl' })
//      .when('/:consoleId/:gameId', { templateUrl: 'app/views/game.html', controller: 'GameDetailsCtrl' })
//      .otherwise({ redirectTo: '/nes' });
//});

app.factory('GamesService', function ($resource, $location) {
    return $resource('/api/:consoleId');
});

app.factory('CombinedGamesService', function ($resource) {
    return $resource('/api/:consoleId/user/:userId');
});

app.factory('GameDetailsService', function($resource) {
  return $resource('/api/:consoleId/:gameId');
});

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

app.controller('IndexCtrl', function($scope, consoles){
	$scope.consoles = consoles;
});

app.controller('AdminCtrl', function ($scope, $http, consoles, baseRegions) {
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

    $scope.editGame = function(g) {
        $scope.selected.id = g;
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