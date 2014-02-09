app.controller('GameDetailsCtrl', function ($scope, $stateParams, GameDetailsService) {
    console.log('gamedetailsctrl');
    //if (!$stateParams.gameId.length) {
    //    return;
    //}
    //$scope.selected.id = $stateParams.gameId;
    //$scope.games.$promise.then(function (result) {
    //    $scope.games = result;
    //    var current = _.find($scope.games, function (g) {
    //        return g.id === $scope.selected.id;
    //    });
    $scope.game = {};

        //if (!current.content) {
            GameDetailsService.get({ consoleName: $stateParams.consoleName, gameName: $stateParams.gameName }, function (game) {
                $scope.game.content = game.name;
            });
        //}
    //});
});