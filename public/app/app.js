'use strict';

var app = angular.module('sndb', ['ngResource', 'ngRoute']);

app.config(function($locationProvider, $routeProvider) {
  $routeProvider
    .when('/admin', {templateUrl: 'app/views/admin/index.html', controller: 'AdminCtrl'})
    .when('/:consoleId', {templateUrl: 'app/views/games_list.html', controller: 'GameListCtrl'})
    .when('/:consoleId/:gameId', {templateUrl: 'app/views/game.html', controller: 'GameDetailsCtrl'})
    .otherwise({redirectTo: '/nes'}); 
});

app.factory('GamesService', function($resource) {
  return $resource('/api/:consoleId');
});

app.factory('GameDetailsService', function($resource) {
  return $resource('/api/:consoleId/:gameId');
});

app.constant('consoles', [
	{'id': 'nes', 'name': 'Nintendo Entertainment System'}, 
	{'id': 'snes', 'name': 'Super Nintendo Entertainment System'}]);

app.controller('IndexCtrl', function($scope, consoles){
	$scope.consoles = consoles;
});

app.controller('AdminCtrl', function($scope, $http, consoles){
	$scope.user = 'Mårten';
	$scope.consoles = consoles;

	$scope.addGame = function(game){
		console.log(game);
		$http.post('/api/newgame', game).
		success(function(response){
      		console.log('response from server: ' + response.reply)
    	}).
		error(function(id){
	  		console.log('server response failed')
		})
	};
});

app.controller('GameListCtrl', function($scope, $location, $routeParams, GamesService) {
  GamesService.query({consoleId: $routeParams.consoleId || 'nes'}, function(games){
    $scope.games = games;
  });
});

app.controller('GameDetailsCtrl', function($scope, $location, $routeParams, GameDetailsService) {
  GameDetailsService.query({consoleId: $routeParams.consoleId, gameId: $routeParams.gameId}, function(game){
    $scope.game = game[0].value;
  });
});