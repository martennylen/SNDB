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