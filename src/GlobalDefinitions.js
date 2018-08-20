var USER_DATA_VERSION = 0.02;

var TILE_SIZE = 16;
var ICON_SIZE = 64;

var BUILD_MAX_VERTICAL = 3;
var BUILD_MAX_HORIZONTAL = 5;
var BUILD_UI_PADDING = 5;
var BUILD_UI_WIDTH = (ICON_SIZE * BUILD_MAX_HORIZONTAL) + ((BUILD_MAX_HORIZONTAL + 1) * BUILD_UI_PADDING);
var BUILD_UI_HEIGHT = (ICON_SIZE * BUILD_MAX_VERTICAL) + ((BUILD_MAX_VERTICAL + 1) * BUILD_UI_PADDING);

var ARMOUR_TYPES = {
    NONE:           0,
    LIGHT:          1,
    MEDIUM:         2,
    HEAVY:          3,
    FORTIFIED:      4,
    SPIRITUAL:      5,
    UNDEAD:         6
};

var ATTACK_TYPES = {
    NORMAL:         0,
    PIERCING:       1,
    SIEGE:          2,
    MAGIC:          3,
    SPIRITUAL:      4,
    PURE:           5,
};

var ELEMENTS = {
    NONE:           0,
    IGNIS:          1,
    AQUA:           2,
    VENTUS:         3,
    TERRA:          4,
    LIGHT:          5,
    DARK:           6,
    VOID:           7
};

var DIRECTION = {
    DOWN:           0,
    LEFT:           1,
    RIGHT:          2,
    UP:             3
};

var TYPE_MULTIPLIER = [
    [1, 1, 1, 0.75, 0.5, 0.5, 0.75],
    [2, 1.5, 1, 0.75, 0.5, 0.75, 0.5],
    [0.5, 0.75, 1, 1.5, 2, 0.5, 1],
    [0.5, 1, 1.5, 2, 0.25, 0.3, 2],
    [1, 1, 1, 1, 1, 1, 1]
];

var ELEMENT_MULTIPLIER = [
    [1, 1, 1, 1, 0.75, 1, 1, 0.5],
    [1, 0.75, 0.25, 2, 1, 1.25, 1, 1.5],
    [1, 2, 0.5, 1, 1.25, 1, 1, 1.5],
    [1, 1, 1.5, 1, 0.5, 1, 1, 1.5],
    [1.25, 1.5, 0.5, 0.75, 1, 1, 1, 1.5],
    [1, 0.75, 1, 1, 1.25, 0.75, 2, 0.5],
    [1, 1.25, 1.25, 1.25, 1.25, 0.25, 1, 0.5],
    [2, 0.75, 0.75, 0.75, 0.75, 2, 2, 0.5]
];

var SKILL_TYPES = {
    PASSIVE:        0,
    ACTIVE:         1,
    AURA:           2
};

var TARGET_TYPES = {
    SELF:           0,
    ENEMY:          1
}

var ARMOUR_DAMAGE_REDUCTION_MULTIPLIER = 0.06;

var walkingFrames = {
    DOWN:   [cc.rect(0,0,32,32), cc.rect(32,0,32,32), cc.rect(64, 0, 32, 32)],
    LEFT:   [cc.rect(0,32,32,32), cc.rect(32,32,32,32), cc.rect(64, 32, 32, 32)],
    RIGHT:  [cc.rect(0,64,32,32), cc.rect(32,64,32,32), cc.rect(64, 64, 32, 32)],
    UP:     [cc.rect(0,96,32,32), cc.rect(32,96,32,32), cc.rect(64, 96, 32, 32)]
};

var selector = [walkingFrames.DOWN, walkingFrames.LEFT, walkingFrames.RIGHT, walkingFrames.UP];

var PlayerData = function($data) {
    $data = $data || {};
    this.name = $data.name || "DEFAULT";
    this.lvl = $data.lvl || 1;
    this.unlockedStages = $data.unlockedStages || [1];
    this.shopCoins = $data.shopCoins || 0;
    this.inventory = $data.inventory || [];
};

var createArray = function ($data) {
    if ($data.length === 0) return [];
    var array = [];
    var arrayString = ""+$data;
    var spliced = arrayString.split(",");

    for (var i = 0, len = spliced.length; i < len; i = (i+1) | 0) {
        array.push(parseFloat(spliced[i]));
    }
    return array;
}


/**
 * 0埋め
 * @param {Number|String} $target
 * @param {Number} $length
 * @return {String}
 */
var zeroPadding = function ($target, $length) {
    if ($length <= 0) return "";
    var value = String(($target) ? parseInt($target) : 0);
    if ($length <= value.length) return value;
    return (Array($length).join('0') + value).slice(-$length);
};

function arrayHasOwnIndex($array, $prop) {
    return $array.hasOwnProperty($prop) && /^0$|^[1-9]\d*$/.test($prop) && $prop <= 4294967294; // 2^32 - 2
};

function returnProperString($string) {
    var lower = $string.toLowerCase();
    return lower.charAt(0).toUpperCase() + lower.slice(1);
};

function colourText($elementNo) {
    switch ($elementNo) {
        case 0: return cc.color(255,255,255);
        case 1: return cc.color(255, 0, 0);
        case 2: return cc.color(22, 111, 213);
        case 3: return cc.color(236, 238, 17);
        case 4: return cc.color(146, 94, 15);
        case 5: return cc.color(254, 255, 104);
        case 6: return cc.color(82, 0, 139);
        case 7: return cc.color(174, 253, 255);
    }
};