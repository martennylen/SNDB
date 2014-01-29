app.controller('AdminCtrl', function ($scope, $http, $location, consoles, baseRegions, roles) {
    
    //roles.$promise.then(function (roles) {
    //    $scope.roles = roles;
    //});
    $scope.roles = roles;
    console.log($scope.roles);
    $scope.user = 'Mårten';
    $scope.consoles = consoles;
    $scope.regions = _.map(baseRegions, function (r) { r.selected = false; return r; });
    $scope.game = {};
    $scope.game.regions = [];
    $scope.postMessage = '';

    $scope.addRegion = function (r) {
        if (r.selected) {
            $scope.game.regions.push(r.id);
        }
        else {
            $scope.game.regions.splice(_.indexOf($scope.game.regions, r.id), 1);
        }
    };

    $scope.addGame = function (game) {
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