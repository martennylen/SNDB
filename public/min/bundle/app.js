"use strict";var app=angular.module("trackr",["ngResource","ngRoute","ui.router","ngCookies","infinite-scroll"]);app.config(["$httpProvider","$routeProvider","$locationProvider","$urlRouterProvider","$stateProvider",function(a,b,c,d,e){d.when("","/nes/"),e.state("login",{url:"/login",templateUrl:"app/account/login.html",controller:"LoginCtrl"}).state("register",{url:"/register",templateUrl:"app/account/register.html",controller:"RegisterCtrl"}).state("admin",{url:"/admin",templateUrl:"app/admin/index.html",controller:"AdminCtrl",resolve:{user:validateUser}}).state("user",{url:"/user/:userName",templateUrl:"app/user/header.html",controller:"UserHeaderCtrl",resolve:{stats:["BazingaService","$stateParams","$q",function(a,b,c){var d=c.defer();return a.query({userName:b.userName,level:2}).$promise.then(function(d){return c.all(_.map(d,function(d){return a.query({userName:b.userName,consoleName:d.id,level:3}).$promise.then(function(e){return d.regions=e,c.all(_.map(e,function(c){return a.query({userName:b.userName,consoleName:d.id,regionName:c.id,level:4}).$promise.then(function(a){return c.subRegions=a,a})})).then(function(a){return e})})})).then(function(a){return d})}).then(function(a){d.resolve(a)}),d.promise}],attrs:["UserAttrService","$stateParams","$q",function(a,b,c){var d=c.defer();return a.query({userName:b.userName,level:2}).$promise.then(function(a){d.resolve(a)}),d.promise}]}}).state("user.region",{url:"/:consoleName/:regionName",templateUrl:"app/user/user.html",controller:"UserCtrl"}).state("user.region.subRegion",{url:"/:subRegionName",templateUrl:"app/user/userlist.html",controller:"UserListCtrl"}).state("console",{url:"/:consoleName",templateUrl:"app/game/header.html",controller:"HeaderCtrl",resolve:{consoles:["GameStructureService",function(a){return a}]}}).state("console.region",{url:"/:regionName",templateUrl:"app/game/regionlist.html",controller:"GameRegionCtrl"}).state("console.region.subregion",{url:"/:subRegionName",templateUrl:"app/game/masterlist.html",controller:"GameListCtrl"}).state("game",{url:"/:consoleName/:regionName/:subRegionName/:gameName",templateUrl:"app/game/game.html",controller:"GameDetailsCtrl"})}]);var validateUser=["$q","$http","$location","$timeout",function(a,b,c,d){var e=a.defer();return b.get("/api/loggedin").success(function(a){a.status?d(function(){e.resolve(a.user)},0):(d(function(){e.reject()},0),c.path("/nes"))}),e.promise}];app.factory("GameStructureService",["GamesStatsService","$q",function(a,b){var c=b.defer();return a.query({level:1}).$promise.then(function(c){return b.all(_.map(c,function(c){return a.query({consoleName:c.id,level:2}).$promise.then(function(d){return c.regions=d,b.all(_.map(d,function(b){return a.query({consoleName:c.id,regionName:b.id,level:3}).$promise.then(function(a){return b.subRegions=a,a})})).then(function(a){return d})})})).then(function(a){return c})}).then(function(a){c.resolve(a)}),c.promise}]),app.factory("GamesStatsService",["$resource",function(a){return a("/api/stats")}]),app.factory("UserGamesService",["$resource",function(a){return a("/api/user/:userName/:consoleName/:regionName/:subRegionName")}]),app.factory("UserAttrService",["$resource",function(a){return a("/api/user/stats/attrs/:userName")}]),app.factory("BazingaService",["$resource",function(a){return a("/api/user/stats/:userName")}]),app.factory("GamesService",["$resource",function(a){return a("/api/:consoleName/:regionName/:subRegionName")}]),app.factory("GameDetailsService",["$resource",function(a){return a("/api/:consoleName/:regionName/:subRegionName/:gameName")}]),app.constant("consoles",[{id:"nes",name:"NES"},{id:"snes",name:"SNES"},{id:"n64",name:"GB"},{id:"n64",name:"N64"},{id:"gc",name:"GC"},{id:"wii",name:"Wii"},{id:"wiiu",name:"WiiU"},{id:"gw",name:"G&W"}]),app.constant("baseRegions",[{id:"pal-b",name:"PAL-B",selected:!0,regions:[{id:"scn",name:"SCN",selected:!0},{id:"noe",name:"NOE",selected:!1},{id:"esp",name:"ESP",selected:!1},{id:"fra",name:"FRA",selected:!1},{id:"hol",name:"HOL",selected:!1}]},{id:"pal-a",name:"PAL-A",selected:!1,regions:[{id:"ukv",name:"UKV",selected:!0},{id:"ita",name:"ITA",selected:!1},{id:"aus",name:"AUS",selected:!1}]},{id:"ntsc",name:"NTSC",selected:!1,regions:[{id:"ntsc",name:"NTSC",selected:!0}]},{id:"ntsc-j",name:"NTSC-J",selected:!1,regions:[{id:"ntsc-j",name:"NTSC-J",selected:!0}]}]),_.mixin(_.str.exports()),app.controller("UserCtrl",["$scope","$location","$state","$stateParams","$http","$timeout","stats","attrs",function(a,b,c,d,e,f,g,h){console.log("userCtrl"),a.userName=d.userName,a.consoleName=d.consoleName,a.regionName=d.regionName,a.currentRegion={},a.stats=g,a.userAttrs=h;if(a.regionName.length===0){b.path("/user/"+d.userName+"/"+d.consoleName+"/"+a.stats[0].regions[0].id+"/"+a.stats[0].regions[0].subRegions[0].id).replace();return}b.$$path.split("/").length===6&&(a.subRegionName=b.$$path.split("/")[5]),a.regions=_.find(a.stats,function(b){return b.id===a.consoleName}).regions,a.currentRegion.region=_.find(a.regions,function(b){return b.id===a.regionName}),a.subRegions=a.currentRegion.region.subRegions,a.currentRegion.subRegion=_.find(a.subRegions,function(b){return b.id===a.subRegionName}),a.regionChanged=function(c){b.path("/user/"+d.userName+"/"+d.consoleName+"/"+a.currentRegion.region.id+"/"+a.currentRegion.region.subRegions[0].id).replace()},a.subRegionChanged=function(c){b.path("/user/"+d.userName+"/"+d.consoleName+"/"+a.currentRegion.region.id+"/"+c.id).replace()};var i=[],j=[];a.search=function(){if(a.q===undefined)return;if(a.q.length===0){a.games=a.initialResult,a.showQ=!1;return}var b=_.filter(i,function(b){return _.any(b.tags,function(b){return _(b).startsWith(a.q)})});b.length===0?l(a):j=b};var k=function(a){a.$apply(function(){m(a)})},l=_.debounce(k,1e3),m=function(a){a.q!==undefined&&(console.log("eller så söker vi lite..."),f(function(){a.pendingPromise&&f.cancel(a.pendingPromise),a.pendingPromise=e.get("/api/search/"+d.consoleName+"?q="+a.q.substring(0,3).toLowerCase()+"&r="+a.userName),a.pendingPromise.success(function(b){i=b.games,j=_.filter(b.games,function(b){return _.any(b.data.tags,function(b){return _(b).startsWith(a.q.toLowerCase())})}),a.$broadcast("searchResult",j,!0),a.showQ=!0,console.log("och nu kom resultatet")})},0))}}]),app.controller("UserListCtrl",["$scope","$location","$stateParams","$http","UserGamesService",function(a,b,c,d,e){function k(a){var b=_.reduceRight(a,function(a,b){return a.concat(b)},[]);return _.every(b,function(a){return!a})}console.log("userlistctrl"),a.userName=c.userName,a.subRegionName=c.subRegionName,a.regionName=c.regionName,a.consoleName=c.consoleName,a.selected={};var f=[],g="",h=0,i={},j="";a.isFetching=!1,a.reachedEnd=!1,a.$on("searchResult",function(b,c,d){d?a.games=c:a.games=f}),a.getGames=function(){if(a.isFetching||a.reachedEnd||a.showQ)return;a.isFetching=!0,e.get({userName:c.userName,consoleName:c.consoleName,regionName:c.regionName,subRegionName:c.subRegionName,gameName:j,docid:g,skip:h}).$promise.then(function(b){_.isEmpty(i)||f.push(i),b.games.length<21?(f=f.concat(b.games),a.reachedEnd=!0):(f=f.concat(_.initial(b.games)),i=_.last(b.games),j=i.data.name,g=i.item,h=1),a.games=f,a.loggedIn=b.loggedIn,a.isFetching=!1})},a.$watch("consoleName",function(b){b&&a.$emit("consoleChanged",b)}),a.idEditing=!1,a.editGame=function(b){if(!a.loggedIn)return;a.isEditing=!a.isEditing;var c=_.map(b.data.variants,function(a){return _.pluck(a.attr.common,"status")});a.isEditing?a.selected=JSON.parse(angular.toJson({id:b.id,item:b.item,variants:b.data.variants,attrs:c})):a.selected.id!==b.id?(a.selected=JSON.parse(angular.toJson({id:b.id,item:b.item,variants:b.data.variants,attrs:c})),a.isEditing=!0):a.selected={}},a.attrChanged=function(b,c,d){a.selected.attrs[b][c]=d,a.willRemove=k(a.selected.attrs)},a.updateGame=function(b){var c=a.selected,e=_.map(c.variants,function(a,b){return{common:c.attrs[b],extras:a.attr.extras,note:a.attr.note}});k(c.attrs)?(console.log("vill ta bort "+c.item),d.post("/api/user/remove",{item:c.item}).success(function(){a.games.splice(_.indexOf(a.games,b),1),a.editGame(b)}).error(function(){console.log("HIELP")})):d.post("/api/user/update",{item:c.item,attr:e}).success(function(){b.data.variants=c.variants,_.each(b.data.variants,function(a){a.isComplete=_.every(_.pluck(a.attr.common,"status"))&&(a.attr.extras.length?_.every(_.pluck(a.attr.extras,"status")):!0)}),b.isComplete=_.every(_.pluck(b.data.variants,"isComplete")),a.editGame(b)}).error(function(){console.log("HIELP")})},a.isDirty=function(b){return angular.toJson(b)!==angular.toJson(a.selected.variants)}}]),app.controller("GameDetailsCtrl",["$scope","$stateParams","GameDetailsService",function(a,b,c){console.log("gamedetailsctrl"),a.game={},c.get({consoleName:b.consoleName,regionName:b.regionName,subRegionName:b.subRegionName,gameName:b.gameName},function(b){a.game.content=b.name})}]),app.controller("GameListCtrl",["$scope","$location","$stateParams","$http","$timeout","GamesService",function(a,b,c,d,e,f){function l(a){var b=_.reduceRight(a,function(a,b){return a.concat(b)},[]);return _.every(b,function(a){return!a})}console.log("gamelistctrl"),a.$emit("PUNG",c.subRegionName),a.selected={};var g=[],h="",i=0,j={},k="";a.isFetching=!1,a.reachedEnd=!1,a.$on("searchResult",function(b,c,d){d?a.games=c:a.games=g}),a.getGames=function(){if(a.isFetching||a.reachedEnd||a.showQ)return;a.isFetching=!0,f.get({consoleName:c.consoleName,regionName:c.regionName,subRegionName:c.subRegionName,gameName:k,docid:h,skip:i}).$promise.then(function(b){_.isEmpty(j)||g.push(j),b.games.length<21?(g=g.concat(b.games),a.reachedEnd=!0):(g=g.concat(_.initial(b.games)),j=_.last(b.games),k=j.data.name,h=j.id,i=1),a.games=g,a.loggedIn=b.loggedIn,a.isFetching=!1})},a.$watch("consoleName",function(b){b&&a.$emit("consoleChanged",b)}),a.idEditing=!1,a.editGame=function(b){if(!a.loggedIn)return;a.isEditing=!a.isEditing;var c=_.map(b.data.variants,function(a){return _.pluck(a.attr.common,"status")});console.log(c),a.isEditing?(a.selected=JSON.parse(angular.toJson({id:b.id,item:b.item,name:b.data.name,variants:b.data.variants,attrs:c,isNew:b.isNew})),console.log(a.selected)):a.selected.id!==b.id?(a.selected=JSON.parse(angular.toJson({id:b.id,item:b.item,name:b.data.name,variants:b.data.variants,attrs:c,isNew:b.isNew})),a.isEditing=!0):a.selected={}},a.attrChanged=function(b,c,d){a.selected.attrs[b][c]=d,a.willRemove=!a.selected.isNew&&l(a.selected.attrs)},a.updateGame=function(b){var c=a.selected,e=_.map(c.variants,function(a,b){return{common:c.attrs[b],extras:a.attr.extras,note:a.attr.note}}),f={id:c.id,console:b.data.console,name:c.name,regions:b.data.regions,attr:e};c.isNew?(console.log("lägger till!"),d.post("/api/user/add",f).success(function(d){b.item=d,b.data.variants=c.variants,_.each(b.data.variants,function(a){a.isComplete=_.every(_.pluck(a.attr.common,"status"))&&(a.attr.extras.length?_.every(_.pluck(a.attr.extras,"status")):!0)}),b.isComplete=_.every(_.pluck(b.data.variants,"isComplete")),b.isNew=!1,a.editGame(b)}).error(function(){console.log("HIELP")})):l(c.attrs)?(console.log("vill ta bort "+c.item),a.$emit("gameRemoved",a.consoleName),d.post("/api/user/remove",{item:c.item}).success(function(){b.data.variants=c.variants,b.isComplete=!1,b.isNew=!0,a.editGame(b)}).error(function(){console.log("HIELP")})):d.post("/api/user/update",{item:c.item,attr:e}).success(function(){b.data.variants=c.variants,_.each(b.data.variants,function(a){a.isComplete=_.every(_.pluck(a.attr.common,"status"))&&(a.attr.extras.length?_.every(_.pluck(a.attr.extras,"status")):!0)}),b.isComplete=_.every(_.pluck(b.data.variants,"isComplete")),a.editGame(b)}).error(function(){console.log("HIELP")})},a.isDirty=function(b){return angular.toJson(b)!==angular.toJson(a.selected.variants)}}]),app.controller("GameRegionCtrl",["$scope","$location","$stateParams","$rootScope","$timeout","$http",function(a,b,c,d,e,f){console.log("gameregion"),a.apa=d.consoles,a.consoleName=c.consoleName,a.regionName=c.regionName,a.currentRegion={};if(a.regionName.length===0){b.path("/"+c.consoleName+"/"+a.apa[0].regions[0].id+"/"+a.apa[0].regions[0].subRegions[0].id).replace();return}b.$$path.split("/").length===4&&(a.subRegionName=b.$$path.split("/")[3]),a.regions=_.find(a.apa,function(b){return b.id===a.consoleName}).regions,a.currentRegion.region=_.find(a.regions,function(b){return b.id===a.regionName}),a.subRegions=a.currentRegion.region.subRegions,a.currentRegion.subRegion=_.find(a.subRegions,function(b){return b.id===a.subRegionName}),a.regionChanged=function(d){b.path("/"+c.consoleName+"/"+a.currentRegion.region.id+"/"+a.currentRegion.region.subRegions[0].id).replace()},a.subRegionChanged=function(d){b.path("/"+c.consoleName+"/"+a.currentRegion.region.id+"/"+d.id).replace()};var g=[],h=[];a.search=function(){if(a.q===undefined)return;if(a.q.length===0){a.$broadcast("searchResult",null,!1),a.showQ=!1;return}var b=_.filter(g,function(b){return _.any(b.tags,function(b){return _(b).startsWith(a.q)})});b.length===0?j(a):h=b};var i=function(a){a.$apply(function(){k(a)})},j=_.debounce(i,1e3),k=function(a){a.q!==undefined&&a.q.length&&(console.log("eller så söker vi lite..."),e(function(){a.pendingPromise&&e.cancel(a.pendingPromise),a.pendingPromise=f.get("/api/search/"+c.consoleName+"?q="+a.q.substring(0,3).toLowerCase()),a.pendingPromise.success(function(b){g=b.games,h=_.filter(b.games,function(b){return _.any(b.data.tags,function(b){return _(b).startsWith(a.q.toLowerCase())})}),a.$broadcast("searchResult",h,!0),a.showQ=!0,console.log("och nu kom resultatet")})},0))}}]),app.controller("HeaderCtrl",["$scope","$location","$state","$stateParams","$rootScope","consoles",function(a,b,c,d,e,f){console.log("header"),e.consoles=f,a.consoles=e.consoles,b.$$path.split("/").length===2&&b.path("/"+e.consoles[0].id+"/").replace()}]),app.controller("UserHeaderCtrl",["$scope","$location","$state","$stateParams","$rootScope","stats","attrs",function(a,b,c,d,e,f,g){console.log("userheader"),e.stats=f,a.userAttrs=g,a.userName=d.userName,a.stats=e.stats,b.$$path.split("/").length===3&&e.stats.length&&b.path("/user/"+d.userName+"/"+e.stats[0].id+"/").replace()}]),app.controller("IndexCtrl",["$scope","$http",function(a,b){console.log("indexCtrl"),a.loggedInUser={},a.isLoggedIn=function(){return!_.isEmpty(a.loggedInUser)},b.get("/api/user/details").success(function(b){_.isEmpty(b)||(a.loggedInUser=b)}),a.showAdminLink=function(){return _.contains(a.loggedInUser.roles,"a")},a.$on("userLog",function(b,c){console.log(b),console.log("user "+JSON.stringify(c)),a.loggedInUser=c})}]),app.controller("LoginCtrl",["$scope","$location","$http",function(a,b,c){console.log("loginctrl"),a.credentials={},a.validateCredentials=function(d){c.post("/api/login",d).success(function(c){c.success?(a.$emit("userLog",c.user),b.path("/user/"+c.user.username)):a.errorMessage=c.message}).error(function(a){console.log(a)})},a.validateFields=function(){return a.loginForm.$valid}}]),app.controller("RegisterCtrl",["$scope","$location","$http",function(a,b,c){console.log("registerctrl"),a.credentials={email:"",username:"",password:""},a.registerCredentials=function(){c.post("/api/register",a.credentials).success(function(c){console.log(JSON.stringify(c)),c.success?(a.$emit("userLog",c.user),b.path("/user/"+c.user.username)):a.errorMessage=c.message}).error(function(b,c){c===409&&(a.errorMessage="Användarnamnet upptaget, välj ett annat.")})},a.validateFields=function(){return a.regForm.$valid}}]),app.controller("LogoutCtrl",["$scope","$location","$http",function(a,b,c){a.logout=function(){c.post("/api/logout").success(function(){a.$emit("userLog",{}),b.path("/login")})}}]),app.controller("AdminCtrl",["$scope","$http","$timeout","$location","consoles","baseRegions","user",function(a,b,c,d,e,f,g){a.user=g,a.consoles=e,a.regions=f,a.game={type:"game",data:{regions:{},variants:[]}},a.postMessage="",a.currentVariant={desc:"",attr:{common:[{id:"c",desc:"",longName:"Kassett",selected:!0},{id:"i",desc:"",longName:"Manual",selected:!0},{id:"b",desc:"",longName:"Kartong",selected:!0}],extras:[]}},a.currentExtra="",a.currentRegions={main:f[0],sub:f[0].regions[0]},a.regionChanged=function(){a.currentRegions.sub=a.currentRegions.main.regions[0]},a.setSelected=function(b){console.log(b),_.each(b.data.variants,function(a){_.each(a.attr.common,function(a){a.selected=!0})});var c=_.findWhere(f,{id:b.data.regions.main});c.selected=!0,a.currentRegions.main=c;var d=_.findWhere(c.regions,{id:b.data.regions.sub});d.selected=!0,a.currentRegions.sub=d,a.game=b,a.games=[],a.currentVariant=a.currentVariant={desc:"",attr:{common:[{id:"c",desc:"",longName:"Kassett",selected:!0},{id:"i",desc:"",longName:"Manual",selected:!0},{id:"b",desc:"",longName:"Kartong",selected:!0}],extras:[]}},a.q="",a.isEditing=!0},a.handleVariant=function(b,c){c&&(_.contains(a.game.data.variants,b)?a.game.data.variants.splice(_.indexOf(a.game.data.variants,b),1):a.game.data.variants.push(b)),a.isEditingVariant=!1,a.currentVariant={desc:"",attr:{common:[{id:"c",desc:"",longName:"Kassett",selected:!0},{id:"i",desc:"",longName:"Manual",selected:!0},{id:"b",desc:"",longName:"Kartong",selected:!0}],extras:[]}}},a.editVariant=function(b){a.isEditingVariant=!0,a.currentVariant=b},a.handleExtra=function(b){_.contains(a.currentVariant.attr.extras,b)?a.currentVariant.attr.extras.splice(_.indexOf(a.currentVariant.attr.extras,b),1):a.currentVariant.attr.extras.push({name:b}),a.currentExtra=""},a.addGame=function(){_.each(a.game.data.variants,function(a){a.attr.common=_.map(a.attr.common,function(a){return{id:a.id,desc:a.desc}})}),a.game.data.regions.main=a.currentRegions.main.id,a.game.data.regions.sub=a.currentRegions.sub.id,console.log(angular.toJson(a.game)),a.isEditing?(console.log("vill uppdatera"),console.log(angular.toJson(a.game)),b.post("/api/admin/update",{game:a.game}).success(function(){a.postMessage="Spel uppdaterat",a.game={type:"game",data:{console:e[0].id,regions:{},variants:[]}},a.currentRegions={main:f[0],sub:f[0].regions[0]}}).error(function(){console.log("HIELP")}),a.isEditing=!1):b.post("/api/newgame",angular.toJson(a.game)).success(function(b){a.postMessage="Spel sparat",a.game={type:"game",data:{console:e[0].id,regions:{},variants:[]}}}).error(function(a){console.log("nej nej NEJ")})},a.validateFields=function(){return a.addGameForm.$valid&&a.game.data.variants.length};var h=[];a.search=function(){if(a.q===undefined)return;if(a.q.length===0){a.games=[],a.showQ=!1;return}var b=_.filter(h,function(b){return _.any(b.tags,function(b){return _(b).startsWith(a.q)})});b.length===0?j(a):a.games=b};var i=function(a){a.$apply(function(){k(a)})},j=_.debounce(i,1e3),k=function(a){a.q!==undefined&&(console.log("eller så söker vi lite...meep"),c(function(){a.pendingPromise&&c.cancel(a.pendingPromise),a.pendingPromise=b.get("/api/search/null?q="+a.q.substring(0,3).toLowerCase()+"&r="+a.userName),a.pendingPromise.success(function(b){h=b.games,a.games=_.filter(b.games,function(b){return _.any(b.data.tags,function(b){return _(b).startsWith(a.q.toLowerCase())})}),a.showQ=!0,console.log(a.games),console.log("och nu kom resultatet")})},0))}}])