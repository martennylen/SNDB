app.controller('GameListCtrl', function ($scope, $location, $route, $stateParams, GamesService, baseRegions) {
    console.log('gamelistctrl');
    $scope.console = $stateParams.consoleName || 'nes';
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

    $scope.games = GamesService.query({ consoleName: $scope.console });
    $scope.games.$promise.then(function (games) {
        $scope.games = games;
    });
});