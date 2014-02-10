app.controller('AdminCtrl', function ($scope, $http, $location, consoles, baseRegions, user) {
    
    //roles.$promise.then(function (roles) {
    //    $scope.roles = roles;
    //});
    $scope.user = user;
    $scope.consoles = consoles;
    $scope.regions = baseRegions;
    $scope.game = { type: 'game', attr: { extras: [] } };
    $scope.game.regions = [];
    $scope.postMessage = '';
    $scope.game.attr.common = [{ id: 'c', longName: 'Kassett', selected: true }, { id: 'i', longName: 'Manual', selected: true }, { id: 'b', longName: 'Kartong', selected: true }];
    $scope.currentExtra = '';

    $scope.currentRegion = {
        region: baseRegions[0],
        subregion: baseRegions[0].regions[0]
    };

    $scope.regionChanged = function() {
        $scope.currentRegion.subregion = $scope.currentRegion.region.regions[0];
    };

    $scope.handleExtra = function (extra) {
        if (_.contains($scope.game.attr.extras, extra)) {
            $scope.game.attr.extras.splice(_.indexOf($scope.game.attr.extras, extra), 1);
        } else {
            $scope.game.attr.extras.push({'name': extra });
        }

        $scope.currentExtra = '';
    };

    $scope.addGame = function (game) {
        console.log($scope.attributes);
        $scope.game.attr.common = _.pluck(_.filter($scope.attributes, function(a) {
            return a.selected;
        }), 'id');

        console.log($scope.game.attr.common);
        //$http.post('/api/newgame', game).
        //success(function (response) {
        //    $scope.postMessage = 'Spel sparat';
        //}).
        //error(function (id) {
        //    console.log('server response failed');
        //});
    };
});