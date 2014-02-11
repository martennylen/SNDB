app.controller('AdminCtrl', function ($scope, $http, $location, consoles, baseRegions, user) {
    
    //roles.$promise.then(function (roles) {
    //    $scope.roles = roles;
    //});
    $scope.user = user;
    $scope.consoles = consoles;
    $scope.regions = baseRegions;
    $scope.game = { type: 'game', regions: {}, attr: { extras: [] } };
    $scope.postMessage = '';
    $scope.attributes = [{ id: 'c', longName: 'Kassett', selected: true }, { id: 'i', longName: 'Manual', selected: true }, { id: 'b', longName: 'Kartong', selected: true }];
    $scope.currentExtra = '';

    $scope.currentRegions = {
        main: baseRegions[0],
        sub: baseRegions[0].regions[0]
    };

    $scope.regionChanged = function() {
        $scope.currentRegions.sub = $scope.currentRegions.main.regions[0];
    };

    $scope.handleExtra = function (extra) {
        if (_.contains($scope.game.attr.extras, extra)) {
            $scope.game.attr.extras.splice(_.indexOf($scope.game.attr.extras, extra), 1);
        } else {
            $scope.game.attr.extras.push({'name': extra });
        }

        $scope.currentExtra = '';
    };

    $scope.addGame = function () {
        $scope.game.attr.common = _.pluck(_.filter($scope.attributes, function (c) {
            return c.selected;
        }), 'id');

        $scope.game.regions.main = $scope.currentRegions.main.id;
        $scope.game.regions.sub = [$scope.currentRegions.sub.id];
        
        console.log(angular.toJson($scope.game));
        $http.post('/api/newgame', angular.toJson($scope.game)).
        success(function (response) {
            $scope.postMessage = 'Spel sparat';
            $scope.game = { type: 'game', console: consoles[0].id, regions: {}, attr: { extras: [] } };
        }).
        error(function (id) {
            console.log('nej nej NEJ');
        });
    };

    $scope.validateFields = function () {
        return $scope.addGameForm.$valid;
    };
});