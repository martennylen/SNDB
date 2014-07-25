app.controller('AdminCtrl', ['$scope', '$http', '$timeout', '$location', 'SearchService', 'GameDataService', 'consoles', 'baseRegions', 'user',
    function ($scope, $http, $timeout, $location, SearchService, GameDataService, consoles, baseRegions, user) {

    var emptyGame = { type: 'parent', data: {console: consoles[0].id }, releases: [] };
    var emptyRelease = { id: '', type: 'game', parent: '', data: { tags: [], variants: [], regions: {} }, $isNew: true };
    var emptyVariant = { desc: '', attr: { common: [{ id: 'c', desc: '', included: true }, { id: 'i', desc: '', included: true }, { id: 'b', desc: '', included: true }], extras: [] } };
    $scope.regions = angular.copy(baseRegions);
        
    $scope.user = user;
    $scope.consoles = consoles;

    $scope.game = angular.copy(emptyGame);
    $scope.currentRelease = angular.copy(emptyRelease);
    $scope.currentVariant = angular.copy(emptyVariant);
    $scope.currentExtra = '';
    $scope.currentTag = {};
        
    $scope.postMessage = '';
    $scope.addOrUpdateRegionText = function () {
        return $scope.currentRelease.id.length ? 'Uppdatera regionsutgåva' : 'Lägg till regionsutgåva';
    };

    $scope.currentRegions = {
        main: $scope.regions[0],
        sub: $scope.regions[0].regions[0]
    };

    $scope.regionChanged = function () {
        console.log('region changed');
        $scope.currentRegions.sub = $scope.currentRegions.main.regions[0];
        $scope.subRegionChanged($scope.currentRegions.sub);
    };

    $scope.subRegionChanged = function (sr) {
        console.log('subregion changed');
        console.log(sr);
        if (sr.child) {
            console.log('jaaa');
            setSelectedRelease(sr.child);
        } else {
            //console.log($scope.game.releases);
            var existingRelease = _.find($scope.game.children, function (release) { return release.data.regions.sub === sr.id; });
            console.log(existingRelease);
            if (existingRelease) {
                $scope.currentRelease = existingRelease;
            } else { //Completely new region edition
                console.log('NY UTGÅVA');
                $scope.currentRelease = angular.copy(emptyRelease);
                $scope.currentRelease.data = angular.copy($scope.game.data);
                $scope.currentRelease.data.variants = [];
                $scope.currentRelease.data.regions = {};

                console.log($scope.game.data);
            }
        }

        $scope.currentVariant = angular.copy(emptyVariant);
    };

    var attrNames = { c: 'Kassett', i: "Manual", b: 'Kartong' };
    $scope.getName = function (id) {
        return attrNames[id];
    };

    $scope.setSelected = function (game) {
        console.log(game);
        resetScope(false);
        $scope.game = game;
        game.children = [];
        
        if (game.releases.length) {
            _.each(game.releases, function(release) {
                var currentRegion = _.find($scope.regions, function (region) { return region.id === release.region; });
                currentRegion.exists = true;
                _.each(release.editions, function(edition) {
                    var subregion = _.find(currentRegion.regions, function (region) { return region.id === edition.subregion; });
                    subregion.exists = true;
                    subregion.child = edition.id;
                });
            });

            $scope.currentRegions.main = _.find($scope.regions, function(region) { return region.id === game.releases[0].region; });
            $scope.currentRegions.sub = _.find($scope.currentRegions.main.regions, function (region) { return region.id === game.releases[0].editions[0].subregion; });
            
            setSelectedRelease(game.releases[0].editions[0].id);
        } else {
            $scope.regions = angular.copy(baseRegions);
            $scope.currentRegions = {
                main: $scope.regions[0],
                sub: $scope.regions[0].regions[0]
            };

            $scope.subRegionChanged($scope.currentRegions.sub);
        }
    };

    var setSelectedRelease = function (release) {
        GameDataService.get({ gameId: release }, function (r) {
            $scope.currentRelease = r;
            $scope.currentRelease.$isNew = false;
            console.log($scope.currentRelease);
            //$scope.game.children.push($scope.currentRelease);
        });
    };

    $scope.addRelease = function () {
        console.log($scope.currentRelease);
        if (!$scope.game.children) {
            $scope.game.children = [];
        }

        var existing = (_.find($scope.game.children, function (child) { return child.data.regions.sub === $scope.currentRelease.data.regions.sub; }));
        if (!existing) {
            var currentRegion = _.find($scope.regions, function (region) { return region.id === $scope.currentRelease.data.regions.main; });
            var subregion = _.find(currentRegion.regions, function (region) { return region.id === $scope.currentRelease.data.regions.sub; });
            subregion.exists = true;
            $scope.game.children.push($scope.currentRelease);
        }
    };

    $scope.addVariant = function () {
        if ($scope.currentRelease.$isNew) {
            $scope.currentRelease.data.regions.main = $scope.currentRegions.main.id;
            $scope.currentRelease.data.regions.sub = $scope.currentRegions.sub.id;
            $scope.currentRelease.parent = $scope.game.id;
            $scope.currentRelease.$isNew = false;
        }

        //$scope.currentVariant.$id = uuid();
        $scope.currentRelease.data.variants.push($scope.currentVariant);

        $scope.isEditingVariant = false;
        $scope.currentVariant = angular.copy(emptyVariant);
        $scope.toggleVariantForm();
    };

    $scope.toggleVariantForm = function() {
        $scope.showVariantForm = !$scope.showVariantForm;
    };

    $scope.updateVariant = function () {
        var existingVariant = _.find($scope.currentRelease.data.variants, function (variant) { return variant.desc === $scope.currentVariant.desc; });
        console.log(existingVariant);
        existingVariant = angular.copy($scope.currentVariant);
        //$scope.game.children.push($scope.currentRelease);
        $scope.currentVariant = angular.copy(emptyVariant);

        $scope.editVariant();
    };

    $scope.removeVariant = function (variant) {
        var existingVariant = _.find($scope.currentRelease.data.variants, function (v) { return v.desc === variant.desc; });
        $scope.currentRelease.data.variants.splice(_.indexOf($scope.currentRelease.data.variants, existingVariant), 1);

        $scope.currentVariant = angular.copy(emptyVariant);
    };

    $scope.editVariant = function (variant) {
        $scope.isEditingVariant = !$scope.isEditingVariant;
        $scope.currentVariant = variant ? variant : angular.copy(emptyVariant);
        $scope.toggleVariantForm();
    };
    
    $scope.handleExtra = function (extra) {
        if (_.contains($scope.currentVariant.attr.extras, extra)) {
            $scope.currentVariant.attr.extras.splice(_.indexOf($scope.currentVariant.attr.extras, extra), 1);
        } else {
            $scope.currentVariant.attr.extras.push({ 'name': extra });
        }

        $scope.currentExtra = '';
    };

    $scope.handleTag = function (tag) {
        console.log(tag);
        if (_.contains($scope.currentRelease.data.tags, tag.tag)) {
            $scope.currentRelease.data.tags.splice(_.indexOf($scope.currentRelease.data.tags, tag.tag), 1);
        } else {
            $scope.currentRelease.data.tags.push(tag.tag);
        }

        $scope.currentTag = {};
    };

    $scope.abortUpdate = function () {
        $scope.game = angular.copy(emptyGame);
        $scope.isEditing = false;
    };
        
    $scope.abortAdd = function () {
        $scope.game = angular.copy(emptyGame);
    };

    $scope.addGame = function() {
        console.log('vill spara nytt');

        console.log(angular.toJson($scope.game));
        //resetScope();
        $scope.isEditing = true;
        $http.post('/api/game/add', angular.toJson($scope.game))
            .success(function (response) {
                console.log(response);
                $scope.setSelected($scope.game);

                $scope.game.data.tags = response.tags;
                $scope.game.id = response.id;
                
                $scope.currentRelease = angular.copy(emptyRelease);
                $scope.currentRelease.data = angular.copy($scope.game.data);
                $scope.currentRelease.data.variants = [];
                $scope.currentRelease.data.regions = {};

                $scope.postMessage = 'Spel sparat';
            })
            .error(function(err) {
                console.log(err);
            });
    };

    $scope.updateGame = function () {
        
        console.log('vill uppdatera');
        console.log(angular.toJson($scope.game));
        //resetScope();
        //$scope.game = angular.copy(emptyGame);

        $http.post('/api/game/update', angular.toJson($scope.game))
            .success(function () {
                $scope.postMessage = 'Spel uppdaterat';
                resetScope(true);
                $scope.isEditing = false;
            })
            .error(function () {
                console.log('HIELP');
            });
    };

    $scope.validateUpdateFields = function () {
        return $scope.addGameForm.$valid;
    };
        
    $scope.validateAddFields = function () {
        return $scope.addGameForm.$valid;
    };

    $scope.search = function() {
        SearchService.SearchInternal($scope);
    };

    function resetScope(empty) {
        console.log('RENSA');
        $scope.q = '';
        $scope.postMessage = '';
        $scope.games = [];
        
        if (empty) {
            $scope.game = angular.copy(emptyGame);
        }
        $scope.currentRelease = angular.copy(emptyRelease);
        $scope.currentVariant = angular.copy(emptyVariant);
        $scope.currentRegions = {
            main: $scope.regions[0],
            sub: $scope.regions[0].regions[0]
        };
        _.each($scope.regions, function(r) {
            r.exists = false;
            _.each(r.regions, function(sr) {
                sr.exists = false;
                sr.child = null;
            });
        });
        $scope.isEditing = true;
        console.log($scope.game.data);
    };

    function uuid() {
        var d = new Date().getTime();
        return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = (d + Math.random() * 16) % 16 | 0;
            d = Math.floor(d / 16);
            return (c == 'x' ? r : (r & 0x7 | 0x8)).toString(16);
        });
    };

    }]);