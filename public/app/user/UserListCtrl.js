app.controller('UserListCtrl', function ($scope, $location, $stateParams, $http, baseRegions, gameResponse) {
    console.log('userlistctrl');
    $scope.consoleName = $stateParams.consoleName;
    $scope.games = gameResponse.games;
    $scope.showControls = gameResponse.showControls;
    $scope.$watch('consoleName', function (newValue) {
        if (newValue.length) {
            $scope.$emit('consoleChanged', newValue);
        }
    });

    $scope.userName = $stateParams.userName;
    $scope.selected = {};

    $scope.regions = _.map(baseRegions, function (r) { r.selected = true; return r; });
    $scope.filterBoxes = {};

    _.each($scope.regions, function (f) {
        $scope.filterBoxes[f.id] = f.selected;
    });

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

    $scope.updateGame = function (g) {
        var obj = {
            common: _.pluck(current.attr.common, 'status'),
            extras: _.pluck(current.attr.extras, 'status'),
            note: current.attr.note
        };

        $http.post('/api/user/update', { item: current.item, attrs: obj })
            .success(function () {
                g.attr = current.attr;
                $scope.editGame(g);
            })
            .error(function () {
                console.log('HIELP');
            });
    };

    $scope.isDirty = function (attrs) {
        console.log('anropas');
        return (angular.toJson(attrs) !== angular.toJson($scope.selected.attr));
    };
});