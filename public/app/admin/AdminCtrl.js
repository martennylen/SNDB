app.controller('AdminCtrl',  ['$scope', '$http', '$location', 'consoles', 'baseRegions', 'user', function($scope, $http, $location, consoles, baseRegions, user) {
    $scope.user = user;
    $scope.consoles = consoles;
    $scope.regions = baseRegions;
    $scope.game = { type: 'game', regions: {}, variants: [] };
    $scope.postMessage = '';
    $scope.currentVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', longName: 'Kassett', selected: true }, { id: 'i', desc: '', longName: 'Manual', selected: true }, { id: 'b', desc: '', longName: 'Kartong', selected: true }], extras: [] } };
    $scope.currentExtra = '';

    $scope.currentRegions = {
        main: baseRegions[0],
        sub: baseRegions[0].regions[0]
    };

    $scope.regionChanged = function() {
        $scope.currentRegions.sub = $scope.currentRegions.main.regions[0];
    };

    $scope.handleVariant = function (variant) {
        if (_.contains($scope.game.variants, variant)) {
            $scope.game.variants.splice(_.indexOf($scope.game.variants, variant), 1);
        } else {
            $scope.game.variants.push(variant);
        }

        $scope.currentVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', longName: 'Kassett', selected: true }, { id: 'i', desc: '', longName: 'Manual', selected: true }, { id: 'b', desc: '', longName: 'Kartong', selected: true }], extras: [] } };
    };
    
    $scope.handleExtra = function (extra) {
        if (_.contains($scope.currentVariant.attr.extras, extra)) {
            $scope.currentVariant.attr.extras.splice(_.indexOf($scope.currentVariant.attr.extras, extra), 1);
        } else {
            $scope.currentVariant.attr.extras.push({ 'name': extra });
        }

        $scope.currentExtra = '';
    };

    $scope.addGame = function () {
        _.each($scope.game.variants, function(v) {
            v.attr.common = _.map(v.attr.common, function(a) {
                return { id: a.id, desc: a.desc, };
            });
        });

        $scope.game.regions.main = $scope.currentRegions.main.id;
        $scope.game.regions.sub = [$scope.currentRegions.sub.id];
        
        console.log(angular.toJson($scope.game));
        $http.post('/api/newgame', angular.toJson($scope.game)).
        success(function (response) {
            $scope.postMessage = 'Spel sparat';
            $scope.game = { type: 'game', console: consoles[0].id, regions: {}, variants: [] };
        }).
        error(function (id) {
            console.log('nej nej NEJ');
        });
    };

    $scope.validateFields = function () {
        return $scope.addGameForm.$valid && $scope.game.variants.length;
    };
}]);