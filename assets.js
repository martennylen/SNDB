module.exports = function (assets) {
    assets.root = __dirname;
    assets.addJs('/public/app/app.js', 'app');
    assets.addJs('/public/app/account/*.js', 'app');
    assets.addJs('/public/app/admin/*.js', 'app');
    assets.addJs('/public/app/game/*.js', 'app');
    assets.addJs('/public/app/user/*.js', 'app');

    assets.addJs('/public/lib/angular.js', 'lib');
    assets.addJs('/public/lib/angular-resource.js', 'lib');
    assets.addJs('/public/lib/angular-route.js', 'lib');
    assets.addJs('/public/lib/angular-ui-router.min.js', 'lib');
    assets.addJs('/public/lib/angular-cookies.js', 'lib');
    assets.addJs('/public/lib/underscore-1.4.1.js', 'lib');
    assets.addJs('/public/lib/underscore.string.min.js', 'lib');
}