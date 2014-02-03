app.controller('GameListCtrl', function ($scope, $location, $route, $stateParams, GamesService, baseRegions, gameResponse) {
    console.log('gamelistctrl');
    $scope.console = $stateParams.consoleName || 'nes';
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

    $scope.games = gameResponse.games;
    $scope.loggedIn = gameResponse.loggedIn;

    $scope.idEditing = false;
    $scope.editGame = function (g) {
        if (!$scope.showControls) {
            return;
        }
        $scope.isEditing = !$scope.isEditing;
        if ($scope.isEditing) {
            $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
        } else {
            if ($scope.selected.id !== g.id) {
                $scope.selected = JSON.parse(angular.toJson({ id: g.id, item: g.item, attr: g.attr }));
                $scope.isEditing = true;
            } else {
                $scope.selected = {};
            }
        }
    };

    //$scope.isComplete = function (game) {
    //    console.log(game.attr.common);
    //    return _.every(_.map(game.attr.common, function(attr) {
    //        return attr.status;
    //    }));
    //};
});