var StageSelectScene = cc.Scene.extend({
    onEnter: function () {
        this._super();
        var stageSelectLayer = new StageSelectLayer();
        this.addChild(stageSelectLayer);
    }
});

var StageSelectLayer = cc.Layer.extend({
    _buttons: null,
    ctor: function () {
        this._super();

        this._buttons = [];

        this._createLayers();
        this._createStageButtons();
        this._createShopButton();
        this._setTouchListener();
    },

    handleTouchEvent: function ($loc) {
        var touchedX = $loc.x;
        var touchedY = $loc.y;
        for (var i = 0, len = this._buttons.length; i < len; i = (i + 1)| 0) {
            var buttonSize = this._buttons[i].button.getContentSize();
            var buttonPos = this._buttons[i].button.getPosition();

            if (touchedX >= buttonPos.x - buttonSize.width / 2 && touchedX <= buttonPos.x + buttonSize.width / 2 &&
                touchedY >= buttonPos.y - buttonSize.height / 2 && touchedY <= buttonPos.y + buttonSize.height / 2) {
                if (this._buttons[i].id === 0) {
                    cc.director.runScene(new ShopScene());
                }
                else {
                    this._selectStage(this._buttons[i].id);
                    break;
                }
            }
        }
    },

    _createLayers: function () {
        var backgroundLayer = new cc.LayerColor(cc.color(128,128,128));
        this.addChild(backgroundLayer, 0);

        var coinLabel = new cc.LabelTTF("Coins: " + global.playerDataManager.getCoins(), "Arial", 24);
        coinLabel.setFontFillColor(cc.color(253, 255, 31));
        coinLabel.setPosition(cc.winSize.width/2, 50)
        this.addChild(coinLabel, 1);
    },

    _createStageButtons: function () {
        var height = cc.winSize.height;
        for (var i = 0, len = global.playerDataManager.getUnlockedStages().length; i < len; i = (i+1)|0) {
            var button = this._createButton(global.playerDataManager.getUnlockedStages()[i], "Stage "+global.playerDataManager.getUnlockedStages()[i]);
                button.setPosition(100, height - (global.playerDataManager.getUnlockedStages()[i]*50));
        }
    },

    _createShopButton: function () {
        var width = cc.winSize.width;
        var button = this._createButton(0, "Shop");
        button.setPosition(width - 100, 50);
    },

    _createButton: function ($id, $string) {

        var button = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        button.setContentSize(100, 50);
        button.setColor(cc.color(255,255,255));

        var buttonLabel = new cc.LabelTTF($string, "Arial", 24);
        buttonLabel.setFontFillColor(cc.color(0,0,0));
        buttonLabel.setPosition(button.getContentSize().width/2, button.getContentSize().height/2);
        button.addChild(buttonLabel, 1);

        this.addChild(button, 1);

        this._buttons.push({button: button, id: $id});

        return button;
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

    _selectStage: function ($id) {
        var nextStageScene = new StageScene($id);
        cc.director.runScene(nextStageScene);
    }
});