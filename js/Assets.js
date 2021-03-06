(function() {
    var resourceCache = {};
    var loading = [];
    var readyCallbacks = [];
    var completeCallback = [];
    var assets_loaded = 0;

    function load(urlOrArr) {
        if(urlOrArr instanceof Array) {
            urlOrArr.forEach(function(url) {
                _load(url);
            });
        }
        else {
            _load(urlOrArr);
        }
    }

    function _load(url) {
        if(resourceCache[url]) {
            return resourceCache[url];
        }
        else {
            var img = new Image();
            img.onerror = function() {
                console.log("Failed to load image from " + url);
            };
            img.onload = function() {
                resourceCache[url] = img;

                if(isReady()) {
                    readyCallbacks.forEach(function(func) { func(); });
                }
            };
            resourceCache[url] = false;
            img.src = url;
        }
    }

    function get(url) {
        return resourceCache[url];
    }

    function isReady() {
        var ready = true;
        for(var k in resourceCache) {
            if(resourceCache.hasOwnProperty(k) &&
               !resourceCache[k]) {
                ready = false;
            }
        }
        return ready;
    }

    function onReady(func) {
        readyCallbacks.push(func);
    }

    function onCompletion(func) {
        completeCallback.push(func);
    }

    function completed() {
        assets_loaded += 1;
        if (assets_loaded == asset_json.length) {
            completeCallback.forEach(function(func) { func(); });
        }
    }

    assets = {
        load: load,
        get: get,
        onReady: onReady,
        isReady: isReady,
        onCompletion: onCompletion,
        completed: completed,
        spriteManager: new SpriteManager()
    };
})();

var asset_img = ['/static/jswars/sprites/unit_sprites.png', '/static/jswars/sprites/env_sprites.png'];
var asset_json = ['/static/jswars/sprites/unit_sprites.json', '/static/jswars/sprites/env_sprites.json'];

var UnitNationSprite = {};

function GatherAssets(readyFunc) {
    function loadAssetInfo() {
        for (var i in asset_json) {
            $.ajax({
                url: asset_json[i],
                dataType: 'json',
                complete: ParseAssetInfo.bind(null, asset_json[i]),
                error: function(jqXHR, textStatus, errorThrown) {
                    console.log("Error fetching asset: ", errorThrown);
                }
            });
        }
    }

    assets.onCompletion(readyFunc);
    assets.onReady(loadAssetInfo);
    assets.load(asset_img);
}

function ParseAssetInfo(sheetName, response) {
    var json = response.responseJSON;
    for (var i = 0; i < json.sprites.length; i++) {
        ParseSpriteInfo(json.sprites[i]);
    }

    if (json.supersprites) {
        for (var i = 0; i < json.supersprites.length; i++) {
            ParseSuperSpriteInfo(json.supersprites[i]);
        }
    } else {
        console.log("No supersprites in sheet", sheetName);
    }

    if (json.minWidth && json.minHeight) {
        console.log("Resetting minWidth and minHeight to:", json.minWidth, json.minHeight);
        assets.spriteManager.minWidth = json.minWidth;
        assets.spriteManager.minHeight = json.minHeight;
    }

    assets.completed();
}

function ParseSpriteInfo(sprite) {
    if (sprite.unitNationName !== undefined) {
        UnitNationSprite[sprite.unitNationName] = sprite.name;
    } else {
        console.log(sprite.name, "lacks unitNationName field. Cannot be used as unit sprite");
    }
    var drawPos = {x: 0, y: 0};
    assets.spriteManager.addSprite(sprite.name, sprite.url, drawPos, sprite.srcPos,
                             sprite.width, sprite.height,
                             sprite.animations, sprite.defaultAnimation, false);
}

function ParseSuperSpriteInfo(supersprite) {
    assets.spriteManager.addSuperSprite(supersprite.name,
                                        supersprite.width,
                                        supersprite.height,
                                        supersprite.subsprites,
                                        supersprite.filterName,
                                        supersprite.filterRules);
}

