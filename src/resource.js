var res = {
    testMap: "res/data/mapData/testMap.tmx",
    testMap2: "res/data/mapData/testMap2.tmx",
    pokemonTiles: "res/data/mapData/pokemonTiles.tsx",
    hpBar: "res/sprites/unitSprites/hpBar.png",
    block: "res/sprites/block.png",
    tick: "res/sprites/tick.png",

    proj01: "res/sprites/projectiles/projectile_01.png",
    proj02: "res/sprites/projectiles/projectile_02.png",
    proj03: "res/sprites/projectiles/projectile_03.png",
    proj04: "res/sprites/projectiles/projectile_04.png",
    proj05: "res/sprites/projectiles/projectile_05.png",

    effect01: "res/sprites/effects/effect_01.png",
    effect02: "res/sprites/effects/effect_02.png",
    effect03: "res/sprites/effects/effect_03.png",
    effect04: "res/sprites/effects/effect_04.png",

    icon_ui_build: "res/icons/uiIcons/build.png",
    icon_ui_cancel: "res/icons/uiIcons/cancel.png",
    icon_ui_sell: "res/icons/uiIcons/sell.png",
    icon_ui_start: "res/icons/uiIcons/start.png"
};

var g_resources = [];
for (var i in res) {
    g_resources.push(res[i]);
}
