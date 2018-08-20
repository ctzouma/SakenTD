var ShopScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var shopLayer = new ShopLayer();
        this.addChild(shopLayer);
    }
});

var ShopLayer = cc.Layer.extend({
    _buttons: null,
    _coinLabel: null,
    _viewWidth: 0,
    _infoWidth: 0,
    _dFromCenter: 0,
    _buttonSize: 0,
    _elementLayers: null,
    _elementBack: null,
    ctor: function () {
        this._buttonSize = 96;
        this._dFromCenter =  cc.winSize.height / 2 - (50 + this._buttonSize / 2);
        this._viewWidth = 592;
        this._infoWidth = cc.winSize.width - this._viewWidth;
        this._super();
        this._elementLayers = [];
        this._buttons = [];
        this._setTouchListener();
        this._createLayers();
        this._createExitButton();
        this._createMainButtons();
    },

    handleTouchEvent: function ($loc) {
        var touchedX = $loc.x;
        var touchedY = $loc.y;
        var current = this._elementBack.getChildren()[0];
        if (current) {
            var layer = this._elementLayers.find(function ($layer) {
                return $layer.layer === current;
            });
            var buttons = layer.buttons;
            for (var j = 0, leng = buttons.length; j < leng; j = (j + 1) | 0) {
                var itemButton = buttons[j];
                var itemButtonSize = 96;
                var itemButtonPosition = cc.pAdd(itemButton.getPosition(),
                    cc.p(this._viewWidth / 2 - this._elementBack.getContentSize().width /2, cc.winSize.height / 2 - this._elementBack.getContentSize().height / 2));
                if (touchedX >= itemButtonPosition.x - itemButtonSize / 2 && touchedX <= itemButtonPosition.x + itemButtonSize/ 2 &&
                    touchedY >= itemButtonPosition.y - itemButtonSize / 2 && touchedY <= itemButtonPosition.y + itemButtonSize / 2) {
                    if (itemButton.getChildByName("mask") === null) {
                        var cost = global.itemList[itemButton.getTag()].cost;
                        if (global.playerDataManager.getCoins() >= cost) {
                            var coins = global.playerDataManager.getCoins();
                            coins -= cost;
                            global.playerDataManager.setCoins(coins);
                            global.playerDataManager.addToInventory(itemButton.getTag());
                            global.playerDataManager.saveData();
                            this._drawTick(itemButton);
                            this._disableButton(itemButton);
                            var canBuy = this._checkCanBuy(itemButton.getTag());
                            if (canBuy) {
                                for (var k in global.itemList) {
                                    if (arrayHasOwnIndex(global.itemList, k)) {
                                        if (global.itemList[k].required === itemButton.getTag()) {
                                            var unmaskId = global.itemList[k].id;
                                            var toUnmask = buttons.find(function ($button) {
                                                return $button.getTag() === unmaskId;
                                            });
                                            toUnmask.getChildByName("mask").removeFromParent(true);
                                            toUnmask.setOpacity(255);
                                        }
                                    }
                                }
                            }
                            this._updateView();
                        }
                    }
                }
            }
        }
        for (var i = 0, len = this._buttons.length; i < len; i = (i + 1)| 0) {
            var button = this._buttons[i];
            var buttonSize = button.getContentSize();
            var buttonPos = button.getPosition();

            if (touchedX >= buttonPos.x - buttonSize.width / 2 && touchedX <= buttonPos.x + buttonSize.width / 2 &&
                touchedY >= buttonPos.y - buttonSize.height / 2 && touchedY <= buttonPos.y + buttonSize.height / 2) {
                if (button.getTag() === 0) cc.director.runScene(new StageSelectScene());
                else {
                    var layer = this._elementLayers.find(function ($layer) {
                        return $layer.layer.getTag() === button.getTag();
                    });
                    if (current) {
                        if (current !== layer.layer) {
                            current.removeFromParent(false);
                            this._elementBack.addChild(layer.layer, 1);
                        }
                    } else {
                        this._elementBack.addChild(layer.layer, 1);
                    }
                }
            }
        }
    },

    _createExitButton: function () {
        var exitButton = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        exitButton.setContentSize(100, 50);

        var exitLabel = new cc.LabelTTF("Exit", "Arial", 24);
        exitLabel.setFontFillColor(cc.color(0,0,0));
        exitLabel.setPosition(exitButton.getContentSize().width/2, exitButton.getContentSize().height/2);
        exitButton.addChild(exitLabel, 1);

        exitButton.setPosition(cc.winSize.width / 2 , 50);

        exitButton.setTag(0);
        this._buttons.push(exitButton);
        this.addChild(exitButton, 1);
    },

    _createMainButtons: function () {
        for (var i = 1; i <= 8; i++) {
            this._createMainButton(i);
            this._createElementLayer(i);
        }
    },

    _checkCanBuy: function ($required) {
        if ($required === null) return true;
        var inventory = global.playerDataManager.getInventory();
        if (inventory.indexOf($required) === -1) return false;
        return true;
    },

    _checkBought: function ($id) {
        return (global.playerDataManager.getInventory().indexOf($id) !== -1)
    },

    _createElementLayer: function ($id) {
        var buttons = [];
        var items = [];
        var layer = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        layer.setTag($id);
        layer.setContentSize(this._elementBack.getContentSize());
        layer.setPosition(this._elementBack.getContentSize().width / 2, this._elementBack.getContentSize().height / 2);


        for (var i in global.itemList) {
            if (arrayHasOwnIndex(global.itemList, i)) {
                var padded = zeroPadding(i,4);
                var itemId = padded.slice(0,2);
                if (itemId === zeroPadding($id, 2)) {
                    items.push(global.itemList[i]);
                }
            }
        }
        for (var i = 0, len = items.length; i < len; i = (i + 1) | 0) {
            var buttonSize = 96;
            var paddingSize = (layer.getContentSize().width - buttonSize*2)/3;
            var item = items[i];
            var button = new cc.Sprite("res/icons/itemIcons/item_"+zeroPadding(item.id, 4)+".png");
            button.setScale(0.75);
            var x = i % 2;
            var y = Math.floor(i / 2);
            var xPos = (x+1)*paddingSize + (x * buttonSize) + (buttonSize/2);
            var yPos = layer.getContentSize().height - ((y+1)*paddingSize + (y * buttonSize) + (buttonSize/2));
            button.setPosition(xPos, yPos);
            var cost = new cc.LabelTTF(""+item.cost, "Arial", 36);
            cost.setFontFillColor(cc.color(253, 255, 31));
            cost.setPosition(buttonSize, 20);
            button.addChild(cost, 1);
            button.setTag(parseInt(item.id));
            buttons.push(button);
            var canBuy = this._checkCanBuy(item.required);
            var owned = this._checkBought(item.id);
            if (owned) {
                this._drawTick(button);
                this._disableButton(button);
            }
            if (!canBuy) this._disableButton(button);
            layer.addChild(button, 1);
        }

        switch ($id) {
            case 1:
                layer.setColor(cc.color(255,117,117));
                break;

            case 2:
                layer.setColor(cc.color(108,185,255));
                break;

            case 3:
                layer.setColor(cc.color(242,255,138));
                break;

            case 4:
                layer.setColor(cc.color(219,179,118));
                break;

            case 5:
                layer.setColor(cc.color(188,141,236));
                break;

            case 6:
                layer.setColor(cc.color(255,252,174));
                break;

            case 7:
                layer.setColor(cc.color(159,255,248));
                break;

            case 8:
                layer.setColor(cc.color(159,255,200));
                break;

            default:
                break;
        }

        this._elementLayers.push({layer:layer, buttons: buttons});
    },

    _drawTick: function ($button) {
        var tick = new cc.Sprite(res.tick);
        tick.setPosition(96/2, 96/2);
        $button.addChild(tick, 2);
    },

    _createMainButton: function ($id) {
        var button = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        button.setContentSize(this._buttonSize, this._buttonSize);
        button.setTag($id);

        var label = new cc.LabelTTF("", "Arial", 20);
        label.setPosition(button.getContentSize().width / 2, button.getContentSize().height / 2);
        button.addChild(label, 1);

        var dFromCenter = this._dFromCenter;

        switch ($id) {
            case 1:
                label.setString("Ignis");
                label.setFontFillColor(cc.color(216,64,64));
                button.setColor(cc.color(255,117,117));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(Math.PI/2), cc.winSize.height / 2 + dFromCenter*Math.sin(Math.PI/2));
                break;

            case 2:
                label.setString("Aqua");
                label.setFontFillColor(cc.color(1,111,212));
                button.setColor(cc.color(108,185,255));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(0), cc.winSize.height / 2 + dFromCenter*Math.sin(0));
                break;

            case 3:
                label.setString("Ventus");
                label.setFontFillColor(cc.color(191,201,23));
                button.setColor(cc.color(242,255,138));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(-3*Math.PI/4), cc.winSize.height / 2 + dFromCenter*Math.sin(-3*Math.PI/4));
                break;

            case 4:
                label.setString("Terra");
                label.setFontFillColor(cc.color(182,117,17));
                button.setColor(cc.color(219,179,118));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(3*Math.PI/4), cc.winSize.height / 2 + dFromCenter*Math.sin(3*Math.PI/4));
                break;

            case 5:
                label.setString("Dark");
                label.setFontFillColor(cc.color(146,54,242));
                button.setColor(cc.color(188,141,236));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(Math.PI/4), cc.winSize.height / 2 + dFromCenter*Math.sin(Math.PI/4));
                break;

            case 6:
                label.setString("Light");
                label.setFontFillColor(cc.color(255,231,0));
                button.setColor(cc.color(255,252,174));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(Math.PI), cc.winSize.height / 2 + dFromCenter*Math.sin(Math.PI));
                break;

            case 7:
                label.setString("Void");
                label.setFontFillColor(cc.color(50,210,189));
                button.setColor(cc.color(159,255,248));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(-1*Math.PI/4), cc.winSize.height / 2 + dFromCenter*Math.sin(-1*Math.PI/4));
                break;

            case 8:
                label.setString("Other");
                label.setFontFillColor(cc.color(95,208,143));
                button.setColor(cc.color(159,255,200));
                button.setPosition(this._viewWidth / 2 + dFromCenter*Math.cos(-1*Math.PI/2), cc.winSize.height / 2 + dFromCenter*Math.sin(-1*Math.PI/2));
                break;

            default:
                break;
        }

        this.addChild(button, 1);
        this._buttons.push(button);
    },

    _createLayers: function () {
        var backgroundLayer = new cc.LayerColor(cc.color(128,128,128));
        backgroundLayer.setContentSize(this._viewWidth, cc.winSize.height);
        this.addChild(backgroundLayer, 0);
        var infoBack = new cc.LayerColor(cc.color(0,0,0));
        infoBack.setContentSize(this._infoWidth, cc.winSize.height);
        infoBack.setPosition(backgroundLayer.getContentSize().width, 0);
        this.addChild(infoBack, 0);

        var coinLabel = this._coinLabel = new cc.LabelTTF("Coins: " + global.playerDataManager.getCoins(), "Arial", 24);
        coinLabel.setFontFillColor(cc.color(253, 255, 31));
        coinLabel.setPosition(80, 50)
        this.addChild(coinLabel, 1);

        var back = this._elementBack = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        back.setContentSize(250,250);
        back.setColor(cc.color(255,255,255));
        back.setPosition(this._viewWidth / 2, cc.winSize.height / 2);
        this.addChild(back, 0);
    },

    _setTouchListener: function () {
        cc.eventManager.addListener({
            event: cc.EventListener.TOUCH_ALL_AT_ONCE,
            onTouchesBegan: function (touches, event) {
                var touch = touches[0];
                var loc = touch.getLocation();

                this.loc = {x: loc.x,
                    y: loc.y};

            }.bind(this),

            onTouchesEnded: function (touches, event) {
                this.handleTouchEvent(this.loc);
            }.bind(this)
        }, this);
    },

    _disableButton: function ($button) {
        var mask = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        mask.setColor(cc.color(0,0,0));
        mask.setContentSize(128,128);
        mask.setPosition(128/2, 128/2);
        mask.setName("mask");
        $button.addChild(mask, 1);
        $button.setCascadeOpacityEnabled(true);
        $button.setOpacity(128);
    },

    _updateView: function () {
        this._coinLabel.setString("Coins: "+ global.playerDataManager.getCoins());
    }
});