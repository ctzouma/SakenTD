var StageScene = cc.Scene.extend({
    _stageNo: 0,
    ctor: function ($stageNo) {
        this._super();
        this._stageNo = (cc.isNumber($stageNo)) ? $stageNo : 1;
    },
    onEnter:function () {
        this._super();
        var sceneLayer = new StageSceneLayer(this._stageNo);
        this.addChild(sceneLayer);
    }
});

var StageSceneLayer = cc.Layer.extend({
    _uiBuildBackPanel: null,
    _uiBuildLayer: null,
    _uiBuildTowerLayer: null,
    _uiInfoBackPanel: null,
    _uiWaveInfoBackPanel: null,
    _buildTowerId: 0,
    _buttons: null,
    _background : null,
    _creepIDList : null,
    _creeps: null,
    _towers: null,
    _wayPath: null,
    _buildTiles: null,
    _cycleIndex: 0,
    _towerKeys: null,
    _waypoints: null,
    _waveData: null,
    _waveNumber: 0,
    _initDone: false,
    _onEnterDone: false,
    _releasedCreeps: 1,
    _lives: 0,
    _gold: 0,
    _crystals: 0,
    _creepsLeft: 0,
    _liveLabel: null,
    _goldLabel: null,
    _crystalsLabel: null,
    _waveLabel: null,
    _numLeftLabel: null,
    _stageNo: 0,
    _unlockStage: 0,
    _clearReward: 0,
    _selected: null,
    _highlightAction: null,
    _highlightedObject: null,
    _displayingRange: null,
    _projectiles: null,
    _effects: null,
    _buffs: null,
    _prepareTime: 0,
    _prepareFlag: false,
    _timeLeftLabel: null,
    _first: true,
    _towerLayer: null,
    _creepLayer: null,
    _resultFlag: false,
    _errorLabel: null,
    _ruleLayer: null,
    _defeated: 0,
    _specialDefeated: 0,
    _earnedGold: 0,
    _earnedCrystals: 0,
    _totalLives: 0,
    _totalEnemies: 0,
    _totalSpEnemies: 0,
    _specialWaveInfo: null,
    ctor:function ($stageNo) {
        this._super();

        this._stageNo = $stageNo;
        this._waveData = [];
        this._waypoints = [];
        this._wayPath = [];
        this._creeps = [];
        this._towers = [];
        this._buildTiles = [];
        this._buttons = [];
        this._projectiles = [];
        this._effects = [];
        this._buffs = [];
        this._towerKeys = Object.keys(global.towerList);


        cc.loader.loadJson("res/data/stageData/stage_"+this._stageNo+".json", function(err, result) {
            if (!err) {
                this.initMapData(result);
            }
        }.bind(this));

        this._setTouchListener();
    },

    onEnter: function () {
        this._super();
        this.scheduleUpdate();
        this._onEnterDone = true;
    },

    onExit: function () {
        this.unscheduleUpdate();
        this._super();
    },

    initMapData: function ($result) {

        this._gold = $result.startGold || 100;
        this._waypoints = $result.waypoints;
        this._waveData = $result.waveData;
        this._unlockStage = $result.unlockStage || 1;
        this._background = new cc.TMXTiledMap($result.stageMap);
        this._clearReward = $result.clearReward || 0;
        this._lives = $result.lives || 10;
        this._totalLives = this._lives;
        this.addChild(this._background, 0);

        for (var i = 0, len = this._waveData.length; i < len; i = (i+1)|0) {
            var wave = this._waveData[i];
            this._totalEnemies += wave.creepNum;
            if (i === 6) {
                this._totalSpEnemies += wave.creepNum;
            }
        }

        var buildLayer = this._background.getLayer("buildArea");
        buildLayer.setVisible(false);
        buildLayer.setOpacity(128);
        var buildLayerTiles = buildLayer.getTiles();
        for (var i = 0; i < buildLayerTiles.length; i++) {
            (buildLayerTiles[i] === 2692) ? this._buildTiles.push(1) : this._buildTiles.push(0);
        }

        for (var i = 0, len = this._waypoints.length; i < len; i = (i+1)|0) {
            var pos = this.getPositionAt(this._waypoints[i].x, this._waypoints[i].y);
            this._wayPath.push({x: pos.x, y: pos.y});
        }

        var goldLabel = this._goldLabel =  new cc.LabelTTF("Gold: "+this._gold, "Arial", 24);
        goldLabel.setFontFillColor(cc.color(253, 255, 31));
        goldLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
        goldLabel.setPosition(this._background.width + 60, cc.winSize.height - 25);

        var crystalsLabel = this._crystalsLabel = new cc.LabelTTF("Crystals: " + this._crystals, "Arial", 24);
        crystalsLabel.setFontFillColor(cc.color(76, 217, 226));
        crystalsLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
        crystalsLabel.setPosition(cc.pAdd(goldLabel.getPosition(), cc.p(0,-25)));

        var liveLabel = this._liveLabel = new cc.LabelTTF("Lives: "+this._lives, "Arial", 24);
        liveLabel.setFontFillColor(cc.color(246,132,174));
        liveLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
        liveLabel.setPosition(cc.winSize.width - 60, cc.winSize.height - 25);

        var waveLabel = this._waveLabel = new cc.LabelTTF("", "Arial", 24);
        waveLabel.setFontFillColor(cc.color(255,255,255));
        waveLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_CENTER);
        waveLabel.setPosition(this._background.width + (cc.winSize.width - this._background.width)/2, cc.winSize.height -25);

        var leftLabel = new cc.LabelTTF("Left:", "Arial", 24);
        leftLabel.setFontFillColor(cc.color(255,255,255));
        leftLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        leftLabel.setPosition(cc.pAdd(waveLabel.getPosition(), cc.p(-15, -25)));

        var numLeftLabel  = this._numLeftLabel = new cc.LabelTTF("", "Arial", 24);
        numLeftLabel.setFontFillColor(cc.color(255,255,255));
        numLeftLabel.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        numLeftLabel.setPosition(cc.pAdd(leftLabel.getPosition(),cc.p(42,0)));

        var backgroundSize = this._background.getContentSize();

        this._towerLayer = new cc.Layer();
        this._creepLayer = new cc.Layer();
        this._towerLayer.setContentSize(backgroundSize);
        this._creepLayer.setContentSize(backgroundSize);

        var infoBack = new cc.LayerColor(cc.color(0,0,0));
        infoBack.setContentSize(cc.winSize.width - backgroundSize.width, backgroundSize.height);
        infoBack.setPosition(backgroundSize.width, 0);

        this.addChild(infoBack, 3);

        this.addChild(this._creepLayer, 1);
        this.addChild(this._towerLayer, 2);


        this._uiBuildBackPanel = this._createUiBuildBackPanel();
        this._uiBuildBackPanel.setPosition(((cc.winSize.width - this._background.width) / 2) + this._background.width, BUILD_UI_HEIGHT/2 + 9);

        this._uiInfoBackPanel = this._createUiBuildBackPanel();
        this._uiInfoBackPanel.setPosition(((cc.winSize.width - this._background.width) / 2) + this._background.width, this._uiBuildBackPanel.getPositionY() + BUILD_UI_HEIGHT + 9);
        this._uiInfoBackPanel.setName("infoBackPanel");

        this._uiWaveInfoBackPanel = this._createUiWaveInfoBackPanel();
        this._uiWaveInfoBackPanel.setPosition(((cc.winSize.width - this._background.width) / 2) + this._background.width, cc.winSize.height - 87 - (this._uiWaveInfoBackPanel.getContentSize().height/2));

        this.addChild(this._uiInfoBackPanel,4);

        this.addChild(this._uiWaveInfoBackPanel, 4)

        this._uiBuildLayer = this._createUiBuildLayer();
        this._uiBuildLayer.setName("buildLayer");

        this._uiBuildTowerLayer = this._createUiBuildTowerLayer(0, false);
        this._uiBuildTowerLayer.setName("buildTowerLayer");

        this._uiBuildBackPanel.addChild(this._uiBuildLayer, 1);
        this.addChild(this._uiBuildBackPanel, 4)

        this.addChild(numLeftLabel, 4);
        this.addChild(waveLabel, 4);
        this.addChild(leftLabel, 4);
        this.addChild(goldLabel, 4);
        this.addChild(crystalsLabel, 4);
        this.addChild(liveLabel, 4);

        this._initDone = true;

        if (this._onEnterDone && this._initDone) {
            this.setPreparePhase(60);
            this._createWaveLabel(null, this._waveData[this._waveNumber].creepId);
            var ruleLayer = this._ruleLayer = this._createRuleLayer();
            this._uiInfoBackPanel.addChild(ruleLayer, 1);
        }
    },

    getPositionAt: function (x,y) {
        var layer = this._background.getLayer("background");
        return cc.pAdd(layer.getPositionAt(x,y),cc.p(8,8));
    },

    setPreparePhase: function ($t) {
        this._prepareFlag = true;
        this._prepareTime = $t;
        var tlLabel = new cc.LabelTTF("", "Arial", 24);
        tlLabel.setFontFillColor(cc.color(255,255,255));
        tlLabel.setPosition(cc.pAdd(this._liveLabel.getPosition(), cc.p(0,-25)));
        tlLabel.setName("timeLabel");
        this.addChild(tlLabel, 4);
        this._enableSkipButton(true);
        this._updateTimeLabel();
    },

    _updateTimeLabel: function () {
        var tlLabel = this.getChildByName("timeLabel");
        tlLabel.setString(""+Math.floor(this._prepareTime+1));
        if (this._prepareTime <= 5) {
            tlLabel.setFontFillColor(cc.color(255,0,0));
        }
    },

    _nextWave: function () {
        var creepId = this._waveData[this._waveNumber].creepId;
        var nextId = (this._waveNumber < this._waveData.length - 1) ? this._waveData[this._waveNumber + 1].creepId : null;
        var creepNum = this._creepsLeft = this._waveData[this._waveNumber].creepNum;

        this._createWaveLabel(creepId, nextId);
        this._updateWaveLabel();
        this._setNumLeftLabel(creepNum);

        if (this._specialWaveInfo) this._specialWaveInfo.removeFromParent();

        if (this._waveNumber + 1 === 7) {
            this._specialWaveInfo = this._createSpecialWaveInfo();
            if (this._uiInfoBackPanel.getChildren().length > 0) this._uiInfoBackPanel.removeAllChildren();
            this._uiInfoBackPanel.addChild(this._specialWaveInfo, 1);
        }

        if (this._waveNumber > 0 && this._waveNumber < this._waveData.length) {
            var gold = Math.floor(this._gold * 0.1);
            this._earnedGold += gold;
            this._updateResources(gold, 0);
        }
    },

    _waveCompleteAnimation: function () {
        var backPanel = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        backPanel.setContentSize(150,50);
        backPanel.setColor(cc.color(128,128,128));

        var text = new cc.LabelTTF("Wave "+(this._waveNumber+1)+" complete", "Arial", 18);
        text.setPosition(backPanel.getContentSize().width / 2, backPanel.getContentSize().height /2);

        backPanel.addChild(text, 1);

        backPanel.setPosition(this._background.getContentSize().width / 2, cc.winSize.height + 25);
        this.addChild(backPanel, 4);

        backPanel.runAction(cc.sequence(
            cc.moveBy(0.5, 0, -50),
            cc.delayTime(2),
            cc.moveBy(0.5, 0, 50),
            cc.removeSelf(true),
            cc.callFunc(function (){
                this._waveNumber++;
                if (this._waveNumber >= this._waveData.length) {
                    this.stageEnded();
                } else {
                    this._nextWave();
                    this.setPreparePhase(15);
                }
            }, this)
        ));
    },

    _waveAnimation: function () {
        var backPanel = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        backPanel.setContentSize(100,50);
        backPanel.setColor(cc.color(128,128,128));

        var text = new cc.LabelTTF("Wave "+(this._waveNumber+1)+"/"+this._waveData.length, "Arial", 18);
        text.setPosition(backPanel.getContentSize().width / 2, backPanel.getContentSize().height /2);

        backPanel.addChild(text, 1);

        backPanel.setPosition(this._background.getContentSize().width / 2, cc.winSize.height + 25);
        this.addChild(backPanel, 4);

        backPanel.runAction(cc.sequence(
            cc.moveBy(0.5, 0, -50),
            cc.delayTime(2),
            cc.moveBy(0.5, 0, 50),
            cc.removeSelf(true)
        ));
    },

    _createSpecialWaveInfo: function () {
        var layer = new cc.Layer();
        layer.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);

        var title = new cc.LabelTTF("SPECIAL WAVE", "Arial", 24);
        title.setPosition(BUILD_UI_WIDTH / 2, BUILD_UI_HEIGHT - 24);

        var rules = new cc.LabelTTF("このウェーブは特別。敵からクリスタルを獲得できる。敵が漏れてもライフは減らない。", "Arial", 16);
        rules.setDimensions(BUILD_UI_WIDTH - 40, BUILD_UI_HEIGHT - 40);
        rules.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        rules.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        rules.setPosition(BUILD_UI_WIDTH / 2, BUILD_UI_HEIGHT / 2 - 28);

        layer.addChild(rules, 1);
        layer.addChild(title, 1);
        return layer;
    },

    _createRuleLayer: function () {
        var layer = new cc.Layer();
        layer.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);

        var title = new cc.LabelTTF("How to play", "Arial", 24);
        title.setPosition(BUILD_UI_WIDTH / 2, BUILD_UI_HEIGHT - 24);

        var string = "ウェーブ数: "+this._waveData.length;
        var waveNumber = new cc.LabelTTF(string, "Arial", 16);
        waveNumber.setFontFillColor(cc.color(59, 231, 7));
        waveNumber.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        waveNumber.setPosition(cc.pSub(title.getPosition(), cc.p(0, 30)));
        waveNumber.setDimensions(BUILD_UI_WIDTH - 40, 0);

        var string2 = "ライフ数: "+ this._lives;
        var lives = new cc.LabelTTF(string2, "Arial", 16);
        lives.setFontFillColor(cc.color(244, 40, 40));
        lives.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
        lives.setPosition(cc.pSub(title.getPosition(), cc.p(0, 30)));
        lives.setDimensions(BUILD_UI_WIDTH - 40, 0);

        var rules = new cc.LabelTTF("ウェーブ毎に指定した数の敵が出る。敵を全部倒すと、ウェーブがクリアされる。敵を倒せなくて、出口まで辿り着いたらライフ一つ減る。" +
            "ウェーブを全部クリアしなくて、ライフが全部無くなった時は負け。ウェーブを全部クリアすると勝利。", "Arial", 16);

        rules.setDimensions(BUILD_UI_WIDTH - 40, BUILD_UI_HEIGHT - 40);
        rules.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_CENTER);
        rules.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        rules.setPosition(BUILD_UI_WIDTH / 2, BUILD_UI_HEIGHT / 2 - 28);

        layer.addChild(rules, 1);
        layer.addChild(lives, 1);
        layer.addChild(waveNumber, 1);
        layer.addChild(title, 1);
        return layer;
    },

    _createWaveLabel: function ($currId, $nextId) {
        var waveInfoLayer = this._createUiWaveInfoLayer($currId, $nextId);

        if (this._uiWaveInfoBackPanel.getChildren()[0]) this._uiWaveInfoBackPanel.getChildren()[0].removeFromParent();
        this._uiWaveInfoBackPanel.addChild(waveInfoLayer);
    },

    sendCreeps: function () {
        var creepId = this._waveData[this._waveNumber].creepId;
        var creepNum = this._creepsLeft;
        var killVal = this._waveData[this._waveNumber].killVal;

        this._waveAnimation();

        this.schedule(function () {
            var creep = this._createCreep(0, creepId, killVal);
            this._creeps.push(creep);
            this._releasedCreeps += 1;
            this.choosePath(creep);
        }, 1, creepNum-1, 4, "create_creep");
    },

    choosePath: function($sender) {
        var currIndex = $sender.getPathIndex();
        var nextPathIndex = currIndex + 1;
        if (nextPathIndex >= this._wayPath.length) {
            if (this._waveNumber + 1 != 7) {
                this._lives--;
                this._liveLabel.setString("Lives: "+this._lives);
            }
            this.unitKilled($sender);
            return;
        }
        $sender.setPathIndex(nextPathIndex);
        var currX = $sender.getPositionX();
        var currY = $sender.getPositionY();
        var destX = this._wayPath[nextPathIndex].x;
        var destY = this._wayPath[nextPathIndex].y;

        var distanceX = currX - destX;
        var distanceY = currY - destY;

        if (distanceX < 0) {
            $sender.setCreepDirection(DIRECTION.RIGHT);
            $sender.setSpeedVector(DIRECTION.RIGHT);
        }
        if (distanceX > 0) {
            $sender.setCreepDirection(DIRECTION.LEFT);
            $sender.setSpeedVector(DIRECTION.LEFT);
        }
        if (distanceY < 0) {
            $sender.setCreepDirection(DIRECTION.UP);
            $sender.setSpeedVector(DIRECTION.UP);
        }
        if (distanceY > 0) {
            $sender.setCreepDirection(DIRECTION.DOWN);
            $sender.setSpeedVector(DIRECTION.DOWN);
        }

        this.moveCreep($sender, this._wayPath[nextPathIndex]);
    },

    moveCreep: function($creep, $dest) {
        $creep.moveOrder($dest);
    },

    moveEnded: function($sender) {
        this.choosePath($sender);
    },

    unitKilled: function($sender) {
        this._removeAuraBuffs($sender);
        this._buffs = this._buffs.filter(function (buff) {
            if (buff.getTarget() === $sender) {
                this._removeBuff(buff);
            }
            return buff.getTarget() !== $sender;
        }, this);
        var currentInfo = this._uiInfoBackPanel.getChildren()[0];
        if (currentInfo) {
            if (currentInfo === $sender.getInfoPanel()) {
                currentInfo.removeFromParent();
            }
        }
        if (this._selected === $sender) {
            this._stopHighlightAction();
            this._selected = null;
        }
        if ($sender instanceof Creep) {
            if ($sender.isPlayerDestroy()) {
                this._defeated++;
                var gold = $sender.getRewardGold();
                var crystals = $sender.getRewardCrystals();
                this._killValueAnimation(gold, crystals, $sender);
                if (gold > 0) {
                    this._earnedGold += gold;
                }
                if (crystals > 0) {
                    this._earnedCrystals += crystals;
                    this._specialDefeated++;
                }
                this._updateResources(gold, crystals);
            }
            var index = this._creeps.indexOf($sender);
            if (index !== -1) {
                this._creeps.splice(index, 1);
                $sender.removeFromParent(true);
                this._creepsLeft--;
                this._setNumLeftLabel(this._creepsLeft);
            }
            if (this._creepsLeft === 0) {
                if (this._lives > 0) {
                    this._releasedCreeps = 1;
                    this._waveCompleteAnimation();
                } else {
                    this.gameOver();
                }
            }
        }
        else if ($sender instanceof Tower) {
            var refund = $sender.getTotalCost()*0.5
            this._killValueAnimation(refund, 0, $sender);
            this._updateResources(refund, 0);
            var tower = this._findTowerInArray($sender);
            this._setTileValues(tower.tilePos.x, tower.tilePos.y, 1);
            this._removeTowerFromArray(tower);
            $sender.removeFromParent(true);
        }
    },

    _killValueAnimation: function ($gold, $crystals, $sender) {
        if ($gold !== 0) {
            var goldLabel = new cc.LabelTTF("+"+$gold, "Arial", 16);
            goldLabel.setFontFillColor(cc.color(253, 255, 31));
            goldLabel.enableStroke(cc.color(234,236,0), 1);
            ($sender instanceof Tower) ? goldLabel.setPosition(cc.pAdd($sender.getPosition(), cc.p(0,32))) : goldLabel.setPosition($sender.getPosition());
            this.addChild(goldLabel, 4);

            goldLabel.runAction(cc.sequence(
                cc.moveBy(0.2, 0, 20),
                cc.fadeOut(0.5),
                cc.removeSelf(true)
            ));
        }
       if ($crystals !== 0) {
           var crystalLabel = new cc.LabelTTF("+"+$crystals, "Arial", 16);
           crystalLabel.setFontFillColor(cc.color(76, 217, 226));
           crystalLabel.enableStroke(cc.color(51,204,214), 1);
           crystalLabel.setPosition($sender.getPosition());
           this.addChild(crystalLabel, 4);

           crystalLabel.runAction(cc.sequence(
               cc.moveBy(0.2, 0, 35),
               cc.scaleTo(0.3, 1.2),
               cc.fadeOut(0.5),
               cc.removeSelf(true)
           ));
       }
    },

    _createResultLayer: function ($win) {
        this._resultFlag = true;
        var resultLayer = new ResultLayer($win, this._lives, this._totalLives, this._waveNumber, this._waveData.length, this._earnedGold, this._earnedCrystals, this._defeated, this._totalEnemies, this._specialDefeated, this._totalSpEnemies);
        resultLayer.setPosition(this._background.getContentSize().width / 2, cc.winSize.height / 2);
        resultLayer.setName("result");
        var mask = new cc.LayerColor(cc.color(0,0,0,128));
        mask.setContentSize(cc.winSize.width, cc.winSize.height);
        this.addChild(mask, 5)
        this.addChild(resultLayer, 6);
        return resultLayer;
    },

    _createErrorMessage: function ($string) {
        if (this._errorLabel) this._errorLabel.removeFromParent(true);
        var label = this._errorLabel = new cc.LabelTTF($string, "Arial", 20);
        label.setColor(cc.color(255,0,0));
        label.setPosition(this._background.getContentSize().width - 100, 50);
        this.addChild(label, 4);
        label.runAction(cc.sequence(cc.delayTime(1.5), cc.removeSelf(true)));
    },

    stageEnded: function () {
        var resultLayer = this._prepareResult(true);
        var unlockedStages = global.playerDataManager.getUnlockedStages();
        var alreadyUnlocked = false;
        for (var i = 0, len = unlockedStages.length; i < len; i = (i+1)|0) {
            if (unlockedStages[i] == this._unlockStage) {
                alreadyUnlocked = true;
                break;
            }
        }
        if (!alreadyUnlocked) {
            unlockedStages.push(this._unlockStage);
            global.playerDataManager.setUnlockedStages(unlockedStages);
            resultLayer.addReward("ステージ "+this._unlockStage);
        }
        if (this._clearReward !== 0) resultLayer.addReward("コイン", this._clearReward);
        resultLayer.drawRewardLabels();
        var coins = global.playerDataManager.getCoins();
        coins += this._clearReward;
        global.playerDataManager.setCoins(coins);
        global.playerDataManager.saveData();
    },

    gameOver: function () {
        this._prepareResult(false);
    },

    _prepareResult: function ($win) {
        if (this._selected) {
            this._stopHighlightAction();
            if (this._selected instanceof Tower) this._selected.toggleRangeDisplay();
            this._selected = null;
        }
        this._background.getLayer("buildArea").setVisible(false);
        return this._createResultLayer($win);
    },

    _startNextWave: function () {
        var tlLabel = this.getChildByName("timeLabel");
        tlLabel.removeFromParent(true);
        this._prepareFlag = false;
        this._enableSkipButton(false);
        if (this._first) {
            this._ruleLayer.removeFromParent(true);
            this._nextWave();
            this._first = false;
        }
        this.sendCreeps();
    },

    update: function (dt) {
        this._super(dt);

        if (this._prepareFlag) {
            this._prepareTime -= dt;
            if (this._prepareTime < 0) this._prepareTime = 0;
            this._updateTimeLabel();
            if (this._prepareTime <= 0) {
                this._startNextWave();
            }
        }

        var finishedBuffs = [];
        for (var i = 0, len = this._buffs.length; i < len; i = (i + 1) | 0) {
            var buff = this._buffs[i];
            if (buff instanceof TimedBuff) {
                var finished = buff.tick(dt);
                if (finished) finishedBuffs.push(buff);
            }
        }

        finishedBuffs.forEach(function ($buff) {
            this._removeBuff($buff);
            this._buffs = this._buffs.filter(function (e) {
               return e !== $buff;
            });
        }, this);

        var effects = [];
        this._effects.forEach(function (effect) {
           var finished = effect.playAnimation(dt);
           if (finished) {
               effects.push(effect);
           }
        });

        effects.forEach(function ($effect){
           this._removeEffect($effect);
        }, this);

        var filteredList = [];
        var atLeastOneHit = false;
        for (var i = 0, len = this._projectiles.length; i < len; i = (i + 1) | 0) {
            var proj = this._projectiles[i];
            proj.playAnimation(dt);
            var target = this._projectiles[i].getTarget();
            var exists = this._creeps.indexOf(target);
            var tower = this._projectiles[i].getSource();
            var hit = this._moveProj(proj, target, dt);
            if (hit) {
                filteredList = this._destroyProj(proj);
                var effectId = proj.getEffectId();
                if (effectId !== null) {
                    var he = new Effect(effectId);
                    he.setPosition(target.getPosition());
                    he.setLocalZOrder(tower.getLocalZOrder() + 1);
                    this._towerLayer.addChild(he, 1);
                    this._effects.push(he);
                }
                if (!atLeastOneHit) atLeastOneHit = true;
                if (exists !== -1) this._handleAttack(tower, target);
            }
        }
        if (atLeastOneHit) this._projectiles = filteredList;


        for (var i = 0, len = this._towers.length; i < len; i = (i + 1) | 0) {
            var tower = this._towers[i].tower;
            this._checkSkillCd(tower, dt);
            this._handleSkills(SKILL_TYPES.PASSIVE, tower, null);
            if (tower.isStunned()) continue;
            var atkCd = tower.getAtkCd();
            if (atkCd === -1) continue;
            if (atkCd === 0) {
                var targets = this._checkForEnemy(tower);
                if (targets.length === 0) continue;
                for (var j = 0, length = targets.length; j < length; j = (j + 1) | 0) {
                    var target = targets[j];
                    if (tower.isProjAtk()) {
                        var proj = new Projectile(tower.getProjId(), tower, target);
                        proj.setPosition(cc.pAdd(tower.getPosition(), cc.p(0,16)));
                        proj.setLocalZOrder(tower.getLocalZOrder() + 1);
                        var theta = this._findAngle(proj.getPosition(), target.getPosition());
                        proj.setRotation((theta) * -180 / Math.PI);
                        this._projectiles.push(proj);
                        this._towerLayer.addChild(proj);
                    } else {
                        var effectId = tower.getEffectId();
                        if (effectId !== 0) {
                            var effect = new Effect(effectId);
                            this._effects.push(effect);
                            effect.setPosition(0,8);
                            target.addChild(effect, 1);
                        }
                        this._handleAttack(tower, target);
                    }
                    tower.setAtkCd(tower.getAtkSpeed());
                }
            } else {
                atkCd -= dt;
                if (atkCd < 0) atkCd = 0;
                tower.setAtkCd(atkCd);
            }
        }

        if (!this._prepareFlag) {
            for (var i = 0, len = this._creeps.length; i < len; i = (i + 1) | 0) {
                var creep = this._creeps[i];
                if (!creep) continue;
                this._handleSkills(SKILL_TYPES.PASSIVE, creep, null);
                if (creep.isStunned()) continue;
                var frameTime = creep.getFrameTime();
                if (frameTime === 0) {
                    creep.incrementFrame();
                    creep.setTextureFrame();
                    creep.setFrameTime(0.25);
                } else {
                    frameTime -= dt;
                    if (frameTime < 0) frameTime = 0;
                    creep.setFrameTime(frameTime);
                }

                if (creep.isMoveOrder()) {
                    var vector = creep.getSpeedVector();
                    var start = creep.getStartPos();
                    var dest = creep.getDestPos();
                    if (vector.x === 0) {
                        var result = creep.moveTo(vector.y, start.y, dest.y, dt);
                        creep.setPositionY(result.pos);
                    }
                    if (vector.y === 0) {
                        var result = creep.moveTo(vector.x, start.x, dest.x, dt);
                        creep.setPositionX(result.pos);
                    }
                    creep.setLocalZOrder(cc.winSize.height - creep.getPositionY());
                    if (result.t === 1) creep.endMove();
                }
            }
        }
    },

    _removeAuraBuffs: function ($sender) {
        var passiveSkills = $sender.getPassiveSkills();
        if (passiveSkills.length > 0) {
            var auras = [];
            passiveSkills.forEach(function (skill) {
               if (skill.getType() === SKILL_TYPES.AURA) auras.push(skill);
            });
            if (auras.length > 0) {
                var toRemove = [];
                auras.forEach(function ($aura) {
                    this._buffs.forEach(function ($buff){
                        if ($buff.getSourceSkill() === $aura) toRemove.push($buff.getTarget());
                    });
                }, this)

                toRemove.forEach(function ($unit){
                    this._removeAuraBuff($unit);
                }, this)
            }
        }
    },

    _removeAuraBuff: function ($unit) {
        var buff = this._buffs.find(function ($buff) {
            return $buff.getTarget() === $unit;
        });
        if (buff) {
            this._removeBuff(buff);
            this._buffs = this._buffs.filter(function ($buff) {
                return $buff != buff;
            });
        }
    },

    _handleAttack: function ($source, $target) {
        var atkDmg = this._calculateDamage($source, $target);
        $target.damage(atkDmg);
        this._handleSkills(SKILL_TYPES.ACTIVE, $source, $target, atkDmg);
    },

    _handleSkills: function ($skillType, $source, $target, $atkDmg) {
        var skills = ($skillType === SKILL_TYPES.ACTIVE) ? $source.getActiveSkills() : $source.getPassiveSkills();
        var length = skills.length;

        if (length !== 0) {
            for (var i = 0; i < length; i = (i+1)|0) {
                var skill = skills[i];
                if (skill.getBuffId().indexOf(5) !== -1) {
                    this._handleCleave($target, $atkDmg, skill.getValue(), skill.getAoe());
                    continue;
                }
                if (skill.getCd() === 0 || skill.getUsedCd() === 0) {
                    var targets = this._checkNearbyTargets($source, $target, skill.getAoe(), skill.getTargetType());
                    if (skill.getType() === SKILL_TYPES.AURA) {
                        this._checkStillInAoe(skill, targets);
                    }
                    targets.forEach(function ($target){
                        this._handleBuffs(skill, $source, $target);
                        if (skill.getAtk() !== 0) {
                            var totalSkillDamage = this._calculateDamage(skill, $target)
                            $target.damage(totalSkillDamage);
                        }
                    }, this);
                    if (skill.getCd() !== 0) skill.setUsedCd(skill.getCd());
                }
            }
        }
    },

    _checkStillInAoe: function ($skill, $targets) {
        var targetsOutsideRange = [];
        this._buffs.forEach(function ($buff){
            if ($buff.getSourceSkill() === $skill && $targets.indexOf($buff.getTarget()) === -1) targetsOutsideRange.push($buff.getTarget());
        }, this);
        targetsOutsideRange.forEach(function (target){
            this._removeAuraBuff(target);
        }, this);
    },

    _handleBuffs: function ($skill, $source, $target) {
        var buffIds = $skill.getBuffId();
        var values = $skill.getValue();
        var durations = $skill.getDuration();
        var stacksArray = $skill.getBuffStacks();
        for (var i = 0, len = buffIds.length ; i < len; i = (i + 1) | 0) {
            var buffId = buffIds[i];
            var value = values[i];
            var duration = durations[i];
            var stacks = (stacksArray[i] === 0) ? false : true;

            if (buffId === 2 && $target.isStunned()) {
                this._buffs = this._buffs.filter(function ($e) {
                    if ($e.getId() === 2 && $e.getTarget() === $target) {
                        this._removeBuff($e);
                    }
                    return ($e.getId() !== 2 && $e.getTarget() !== $target);
                }, this);
            }
            var found = null;
            if ($skill.getType() === SKILL_TYPES.AURA) {
                found = this._buffs.find(function ($buff) {
                    return ($buff.getSource() == $source && $buff.getTarget() === $target);
                });
            } else {
                found = this._buffs.find(function ($buff) {
                    return $buff.getTarget() === $target && $buff.getSourceSkill().getId() === $skill.getId() && $buff.getId() === buffId;
                })
            }
            if (!found || (found && found.stacks())) {
                var buff = ($skill.getDuration() !== 0) ? new TimedBuff(buffId, value, stacks, $skill, $source, $target, duration)
                                                        : new Buff(buffId, value, stacks, $skill, $source, $target);
                var effect = buff.applyBuff();
                if (effect) this._effects.push(effect);
                this._buffs.push(buff);
            } else {
                if (!found.stacks() && found instanceof TimedBuff) found.resetTimer();
            }
        }
    },

    _removeEffect: function ($effect) {
        this._removeEffectFromArray($effect);
        $effect.removeFromParent(true);
        $effect = null;
    },

    _removeBuff: function ($buff) {
        var effect = $buff.removeBuff();
        if (effect) {
            this._removeEffect(effect);
        }
    },

    _removeEffectFromArray: function ($effect) {
        this._effects = this._effects.filter(function (effect) {
            return effect !== $effect;
        });
    },

    _handleCleave: function ($source, $atkDmg, value, $aoe) {
        var targets = this._checkNearbyTargets($source, null, $aoe, TARGET_TYPES.SELF);
        targets.slice(1).forEach(function (target) {
            target.damage($atkDmg * value);
        }, this)
    },

    _checkSkillCd: function ($source, $dt) {
        var activeSkills = $source.getActiveSkills();
        var passiveSkills = $source.getPassiveSkills();

        var skills = activeSkills.concat(passiveSkills);

        var length = skills.length;
        if (length !== 0) {
            for (var i = 0; i < length; i = (i+1)|0) {
                var skill = skills[i];
                if (skill.getCd() === 0) continue;
                var cdSinceUsed = skill.getUsedCd();
                if (cdSinceUsed !== 0) {
                    cdSinceUsed -= $dt;
                    if (cdSinceUsed <= 0) {
                        cdSinceUsed = 0;
                    }
                    skill.setUsedCd(cdSinceUsed);
                }
            }
        }
    },

    _checkNearbyTargets: function ($source, $target, $aoe, $targetType) {
        var source = ($target === null) ? $source : $target;
        var sourcePos = source.getPosition();
        if (source instanceof Tower) sourcePos = cc.pAdd(sourcePos, cc.p(0,16));
        var targets = [];
        var searchArray = null;
        if ($source instanceof Creep) searchArray = ($targetType === TARGET_TYPES.ENEMY) ? this._towers : this._creeps;
        if ($source instanceof Tower) searchArray = ($targetType === TARGET_TYPES.ENEMY) ? this._creeps : this._towers;
        for (var i = 0, len = searchArray.length; i < len; i = (i + 1) | 0) {
            var nearby = (searchArray[i] instanceof Creep) ? searchArray[i] : searchArray[i].tower;
            var nearbyPos = nearby.getPosition();
            var dist = Math.sqrt(Math.pow(sourcePos.x - nearbyPos.x, 2) + Math.pow(sourcePos.y - nearbyPos.y, 2));
            if (dist <= $aoe) targets.push(nearby);
        }
        return targets;
    },

    _moveProj: function ($proj, $target, $dt) {
        var targetPos = $target.getPosition();
        var sourcePos = $proj.getPosition();
        var theta = this._findAngle(sourcePos, targetPos);
        var xSpeed = $proj.getFlySpeed() * Math.cos(theta);
        var ySpeed = $proj.getFlySpeed() * Math.sin(theta);

        var dx = xSpeed * $dt;
        var dy = ySpeed * $dt;

        var newX = sourcePos.x + dx;
        var newY = sourcePos.y + dy;

        $proj.setPosition(newX, newY);

        $proj.setRotation((theta) * -180 / Math.PI);

        if ((sourcePos.x - targetPos.x < 0 && sourcePos.y - targetPos.y < 0 && newX - targetPos.x >= 0 && newY - targetPos.y >= 0) ||
            (sourcePos.x - targetPos.x > 0 && sourcePos.y - targetPos.y < 0 && newX - targetPos.x <= 0 && newY - targetPos.y >= 0) ||
            (sourcePos.x - targetPos.x > 0 && sourcePos.y - targetPos.y > 0 && newX - targetPos.x <= 0 && newY - targetPos.y <= 0) ||
            (sourcePos.x - targetPos.x < 0 && sourcePos.y - targetPos.y > 0 && newX - targetPos.x >= 0 && newY - targetPos.y <= 0)) return true;
        return false;
    },

    _destroyProj: function ($proj) {
        var filteredList = this._projectiles.filter(function (e) {
            return e !== $proj;
        });
        $proj.removeFromParent(true);
        $proj = null;
        return filteredList;
    },

    _findAngle: function ($sourcePos, $targetPos) {
        var diffX = $targetPos.x -  $sourcePos.x;
        var diffY = $targetPos.y - $sourcePos.y;
        return Math.atan2(diffY, diffX);
    },

    _checkForEnemy: function($tower) {
        if (this._creeps == null) return null;
        var creeps = [];
        for (var i = 0, len = this._creeps.length; i < len; i = (i + 1) | 0) {
            var creep = this._creeps[i];
            var enemyX = creep.getPositionX();
            var enemyY = creep.getPositionY();
            var pos = cc.pAdd($tower.getPosition(), cc.p(0,16));
            var dist = Math.sqrt(Math.pow(pos.x - enemyX, 2) + Math.pow(pos.y - enemyY, 2));
            if (dist <= $tower.getAtkRange()) {
                if (creeps.indexOf(creep) === -1) creeps.push(creep);
                if (!$tower.isMultiAtk()) return creeps;
            }
        }
        return creeps;
    },

    _createUiBuildBackPanel: function () {
        var backPanel = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        backPanel.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);
        backPanel.setColor(cc.color(128,128,128));
        return backPanel;
    },

    _createUiWaveInfoBackPanel: function () {
        var backPanel = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        backPanel.setContentSize(BUILD_UI_WIDTH, cc.winSize.height - (BUILD_UI_HEIGHT*2 + (4.5*4)) - 96)
        backPanel.setColor(cc.color(128,128,128));
        return backPanel;
    },

    _createUiWaveInfoLayer: function ($id, $nextId) {
        var layer = new cc.Layer();
        var height = this._uiWaveInfoBackPanel.getContentSize().height;
        var width = BUILD_UI_WIDTH;

        var nextLabel = new cc.LabelTTF("Next:", "Arial", 20);
        nextLabel.setPosition(width - 90, height - 20);

        var nextCreepLabel = new cc.LabelTTF("", "Arial", 16);


        nextCreepLabel.setPosition(cc.pAdd(nextLabel.getPosition(), cc.p(0, -20)));

        layer.addChild(nextLabel, 1);
        layer.addChild(nextCreepLabel, 1);
        if ($id) {
            var currentLabel = new cc.LabelTTF("Current:", "Arial", 20);
            currentLabel.setPosition(80, height - 20);
            var currentCreepLabel = new cc.LabelTTF(""+global.creepList[$id].name+" ("+this._waveData[this._waveNumber].creepNum+")", "Arial", 16);
            currentCreepLabel.setPosition(cc.pAdd(currentLabel.getPosition(), cc.p(0, -20)));

            var currentElementLabel = new cc.LabelTTF("E: "+ returnProperString(global.creepList[$id].element), "Arial", 15);
            currentElementLabel.setPosition(cc.pAdd(currentCreepLabel.getPosition(), cc.p(0, -20)));
            var colour = colourText(ELEMENTS[global.creepList[$id].element]);
            currentElementLabel.setFontFillColor(colour);

            if (!$nextId) nextCreepLabel.setString("None");

            var currentArmourTypeLabel = new cc.LabelTTF("AT: "+ returnProperString(global.creepList[$id].armourType), "Arial", 15);
            currentArmourTypeLabel.setPosition(cc.pAdd(currentElementLabel.getPosition(), cc.p(0, -20)));

            layer.addChild(currentLabel, 1);
            layer.addChild(currentCreepLabel, 1);
            layer.addChild(currentElementLabel, 1);
            layer.addChild(currentArmourTypeLabel, 1);
        }

        if ($nextId) {
            var nextElementLabel = new cc.LabelTTF("E: "+ returnProperString(global.creepList[$nextId].element), "Arial", 15);
            nextElementLabel.setPosition(cc.pAdd(nextCreepLabel.getPosition(), cc.p(0, -20)));
            var colour = colourText(ELEMENTS[global.creepList[$nextId].element]);
            nextElementLabel.setFontFillColor(colour);

            if ($id) {
                nextCreepLabel.setString(""+global.creepList[$nextId].name+" ("+this._waveData[this._waveNumber+1].creepNum+")");
            } else {
                nextCreepLabel.setString(""+global.creepList[$nextId].name+" ("+this._waveData[this._waveNumber].creepNum+")");
            }

            var nextArmourTypeLabel = new cc.LabelTTF("AT: "+ returnProperString(global.creepList[$nextId].armourType), "Arial", 15);
            nextArmourTypeLabel.setPosition(cc.pAdd(nextElementLabel.getPosition(), cc.p(0, -20)));

            layer.addChild(nextElementLabel, 1);
            layer.addChild(nextArmourTypeLabel, 1);
        }
        return layer;
    },

    _createUiBuildLayer: function () {
        var layer = new cc.Layer();
        layer.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);
        var buildButton = this._createButton(0, "Build", 1);
        var exitButton = this._createButton(-3, "Exit", 5);
        this._createButton(-4, "Start", 11);
        layer.addChild(exitButton, 1);
        layer.addChild(buildButton, 1);
        return layer;
    },

    _enableSkipButton: function ($enabled) {
        var skipButton = this._buttons.find(function (button) {
            return button.id === -4;
        });
        if ($enabled) {
            this._uiBuildLayer.addChild(skipButton.button, 1);
        } else {
            skipButton.button.removeFromParent();
        }
    },

    _createUiBuildTowerLayer: function ($id, $isUpgradeLayer) {
        var layer = new cc.Layer();
        layer.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);

        var cancelButton = this._createButton(-1, "Cancel", 5);
        layer.addChild(cancelButton, 1);
        if ($isUpgradeLayer) {
            var sellButton = this._createButton(-2, "Sell", 15);
            layer.addChild(sellButton, 1);
        }
        var count = 1;
        for (var i in global.towerList) {
            if (arrayHasOwnIndex(global.towerList, i)) {
                var requiredIds = createArray(global.towerList[i].requiredTowerId);
                if (requiredIds.indexOf($id) !== -1) {
                    if (count > 15) break;
                    if (count === 5) count++;
                    if ($isUpgradeLayer && count === 15) break;
                    var towerButton = this._createButton(parseInt(i), global.towerList[i].name, count);
                    var canBuild = this._checkCanBuild(i);
                    if (!canBuild) this._disableButton(towerButton);
                    layer.addChild(towerButton, 1);
                    count++;
                }
            }
        }
        return layer;
    },

    _checkCanBuild: function ($id) {
        var towerData = global.towerList[$id];
        if (towerData.cost > this._gold) return false;
        if (towerData.specialCost > this._crystals) return false;
        var requiredIds = createArray(towerData.requiredItemId);
        var hasRequirements = true;
        for (var i = 0, len = requiredIds.length; i < len; i = (i + 1) | 0) {
            var id = requiredIds[i];
            if (cc.isNumber(id) && global.playerDataManager.getInventory().indexOf(id) === -1) hasRequirements = false;
        }
        return hasRequirements;
    },

    _createUiBuildUpgradeLayer: function ($id) {
        var layer = this._createUiBuildTowerLayer($id, true);
        layer.setName("upgradeLayer");
        return layer;
    },

    _createButton: function ($id, $string, $position) {
        var y = 0;
        var rem = $position / 5;
        if (rem <= 1) y = 1;
        if (rem > 1 && rem <= 2) y = 2;
        if (rem > 2 && rem <= 3) y = 3;
        var x = $position % 5;
        if (x === 0) x = 5;
        var button = null;
        if ($id <= 0 && $id !== -3) {
            switch ($id) {
                case 0:
                    button = new cc.Sprite(res.icon_ui_build);
                    button.setScale(0.5);
                    break;

                case -1:
                    button = new cc.Sprite(res.icon_ui_cancel);
                    button.setScale(0.5);
                    break;

                case -2:
                    button = new cc.Sprite(res.icon_ui_sell);
                    button.setScale(0.5);
                    break;

                case -4:
                    button = new cc.Sprite(res.icon_ui_start);
                    button.setScale(0.5);
                    break;

                default:
                    break;
            }
        } else {
            button = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
            button.setContentSize(ICON_SIZE,ICON_SIZE);

            var buttonLabel = new cc.LabelTTF($string, "Arial", 10);
            buttonLabel.setFontFillColor(cc.color(0,0,0));
            buttonLabel.setPosition(ICON_SIZE / 2, ICON_SIZE / 2);
            button.addChild(buttonLabel,1);
        }
        if ($id > 0) {
            var costLabel = new cc.LabelTTF(""+global.towerList[$id].cost, "Arial", 12);
            costLabel.enableStroke(cc.color(0,0,0), 1.5);
            costLabel.setPosition(ICON_SIZE - 13, 12);
            costLabel.setFontFillColor(cc.color(253, 255, 31));
            button.addChild(costLabel, 1);

            if (global.towerList[$id].specialCost !== null) {
                var specialCostLabel = new cc.LabelTTF(""+global.towerList[$id].specialCost, "Arial", 12);
                specialCostLabel.enableStroke(cc.color(0,0,0), 1.5);
                specialCostLabel.setPosition(13, 12);
                specialCostLabel.setFontFillColor(cc.color(76, 217, 226));
                button.addChild(specialCostLabel, 1);
            }
        }
        button.setPosition((x - 1) * ICON_SIZE + (x * BUILD_UI_PADDING) + (ICON_SIZE / 2), (y - 1) * ICON_SIZE + (y * BUILD_UI_PADDING) + (ICON_SIZE / 2));
        var buttonLoc = cc.p(this._background.width + button.getPositionX(), button.getPositionY());
        button.setCascadeOpacityEnabled(true);

        this._buttons.push({button: button, id: $id, loc: buttonLoc});

        return button;
    },

    _createCreep: function($index, $id, $killVal) {
        var pos = this._wayPath[$index];
        var creepSprite = new Creep($id, $killVal);
        creepSprite.setDelegate(this);
        creepSprite.initUnitTexture();
        creepSprite.setPathIndex($index);
        creepSprite.setPosition(pos.x, pos.y);
        this._creepLayer.addChild(creepSprite);
        return creepSprite;
    },

    _createTower: function($x, $y, $id) {
        var layer = this._background.getLayer("background");
        var pos = layer.getPositionAt($x,$y);
        var tower = new Tower($id);
        tower.setDelegate(this);
        tower.initUnitTexture(false);
        tower.setPosition(pos.x, pos.y);
        tower.setLocalZOrder(this._background.height - pos.y);

        this._setTileValues($x, $y, 2);

        this._towerLayer.addChild(tower);
        this._updateResources((-1)*tower.getCost(), (-1)*tower.getSpecialCost());
        return tower;
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
                this._handleTouchEvent(this.loc);
            }.bind(this)
        }, this);
    },

    _getTileIndex: function($x, $y) {
        var tileWidth = this._background.tileWidth;
        var mapWidth = this._background.width;
        return $y * (mapWidth/tileWidth) + $x;
    },

    _setTileValues: function ($x, $y, $value) {
        var selectedTileIndex = this._getTileIndex($x, $y);
        var nTileIndex = this._getTileIndex($x, $y-1);
        var nwTileIndex = this._getTileIndex($x-1, $y-1);
        var wTileIndex = this._getTileIndex($x-1, $y);

        this._buildTiles[selectedTileIndex] = $value;
        this._buildTiles[nTileIndex] = $value;
        this._buildTiles[nwTileIndex] = $value;
        this._buildTiles[wTileIndex] = $value;
    },

    _getTileValues: function ($x, $y) {
        var selectedTile = this._getTileIndex($x, $y);
        var nTile = this._getTileIndex($x, $y-1);
        var sTile = this._getTileIndex($x, $y+1);
        var eTile = this._getTileIndex($x+1, $y);
        var wTile = this._getTileIndex($x-1, $y);
        var neTile = this._getTileIndex($x+1, $y-1);
        var nwTile = this._getTileIndex($x-1, $y-1);
        var seTile = this._getTileIndex($x+1, $y+1);
        var swTile = this._getTileIndex($x-1, $y+1);

        if (this._buildTiles[selectedTile] === 1 &&
            this._buildTiles[nTile] === 1 &&
            this._buildTiles[nwTile] === 1 &&
            this._buildTiles[wTile] === 1) return {x: $x, y: $y};

        if (this._buildTiles[selectedTile] === 1 &&
            this._buildTiles[nTile] === 1 &&
            this._buildTiles[neTile] === 1 &&
            this._buildTiles[eTile] === 1) return {x: $x+1, y: $y};

        if (this._buildTiles[selectedTile] === 1 &&
            this._buildTiles[sTile] === 1 &&
            this._buildTiles[swTile] === 1 &&
            this._buildTiles[wTile] === 1) return {x: $x, y: $y+1};

        if (this._buildTiles[selectedTile] === 1 &&
            this._buildTiles[sTile] === 1 &&
            this._buildTiles[seTile] === 1 &&
            this._buildTiles[eTile] === 1) return {x: $x+1, y: $y+1};

        return {x: -1, y: -1};
    },

    _disableButton: function ($button) {
        var mask = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        mask.setContentSize($button.getContentSize().width, $button.getContentSize().height);
        mask.setColor(cc.color(128,128,128));
        mask.setPosition($button.getContentSize().width/2, $button.getContentSize().height/2);
        mask.setName("mask");
        $button.addChild(mask, 0);
        $button.setOpacity(128);
    },

    _enableButton: function ($button) {
        var mask = $button.getChildByName("mask");
        $button.removeChild(mask);
        $button.setOpacity(255);
        return true;
    },

    _checkHasMask: function ($button) {
        return $button.getChildByName("mask") ? true : false;
    },

    _updateResources: function ($gold, $crystals) {
        if ($gold !== 0) {
            this._gold += $gold;
            this._updateGoldLabel();
        }
        if ($crystals !== 0) {
            this._crystals += $crystals;
            this._updateCrystalLabel();
        }
        var currentLayer = this._uiBuildBackPanel.getChildren()[0];
        for (var i = 0, len = this._buttons.length; i < len; i = (i + 1) | 0) {
            var button = this._buttons[i];
            if (button.id === 0 || button.id === -1 || button.id === -2 || button.id === -3 || button.id === -4) continue;
            if (this._checkHasMask(button.button) && this._checkCanBuild(button.id)) {
                this._enableButton(button.button);
                if (currentLayer.getName() === "buildTowerLayer") {
                    if (this._highlightedObject === null) {
                        this._highlightObject(button.button);
                        this._buildTowerId = button.id;
                    }
                }
            }　else if (!this._checkHasMask(button.button) && !this._checkCanBuild(button.id)) {
                this._disableButton(button.button);
                if (currentLayer.getName() === "buildTowerLayer") {
                    if (this._highlightedObject === button.button) {
                        this._stopHighlightAction();
                        this._buildTowerId = 0;
                        this._selected = null;
                        var button = this._findAutoHighlightButton();
                        if (button !== null) {
                            this._selected = button;
                            this._highlightObject(button.button);
                            this._buildTowerId = button.id;
                        }
                    }
                }
            }
        }
    },

    _updateGoldLabel: function () {
        this._goldLabel.setString("Gold: "+ this._gold);
    },

    _updateCrystalLabel: function () {
        this._crystalsLabel.setString("Crystals: " + this._crystals)
    },

    _updateWaveLabel: function () {
        this._waveLabel.setString("Wave "+ (this._waveNumber+1));
    },

    _setNumLeftLabel: function ($num) {
        this._numLeftLabel.setString(""+$num);
    },

    _handleTouchEvent: function ($loc) {
        var tileWidth = this._background.tileWidth;
        var mapWidth = this._background.width;
        var mapHeight = this._background.height;
        var touchedX = $loc.x;
        var touchedY = $loc.y;
        var currentLayer = this._uiBuildBackPanel.getChildren()[0];

        if (this._resultFlag) {
            var resultLayer = this.getChildByName("result");
            var backPlate = resultLayer.getChildren()[0];
            var buttons = resultLayer.getButtons();
            for (var i = 0, len = buttons.length; i < len; i = (i + 1) | 0) {
                var buttonSize = buttons[i].getContentSize();
                var buttonPos = buttons[i].getPosition();
                var backPos = cc.p(buttonPos.x - backPlate.getContentSize().width / 2, buttonPos.y - backPlate.getContentSize().height / 2);
                var relativePos = cc.pAdd(resultLayer.getPosition(), backPos);
                if (touchedX >= relativePos.x - buttonSize.width / 2 && touchedX <= relativePos.x + buttonSize.width / 2 &&
                    touchedY >= relativePos.y - buttonSize.height / 2 && touchedY <= relativePos.y + buttonSize.height / 2) {
                    switch (buttons[i].getTag()) {
                        case 1: // RETRY
                            var nextScene = new StageScene(this._stageNo);
                            cc.director.runScene(nextScene);
                            break;

                        case 2: // EXIT
                            var nextScene = new StageSelectScene();
                            cc.director.runScene(nextScene);
                            break;

                        default:
                            break;
                    }
                }
            }
        }

        else if (touchedX > mapWidth) {
            for (var i = 0, len = this._buttons.length; i < len; i = (i + 1) | 0) {
                var buttonId = this._buttons[i].id;
                var buttonSize = this._buttons[i].button.getContentSize();
                var buttonPos = this._buttons[i].loc;

                if (touchedX >= buttonPos.x - buttonSize.width / 2 && touchedX <= buttonPos.x + buttonSize.width / 2 &&
                    touchedY >= buttonPos.y - buttonSize.height / 2 && touchedY <= buttonPos.y + buttonSize.height / 2) {
                    if (this._checkHasMask(this._buttons[i].button)) continue;
                    if (this._buttons[i].button.getParent() != currentLayer) continue;
                    if (currentLayer.getName() == "buildLayer") {
                        if (buttonId === 0) {
                            this._uiBuildBackPanel.removeChild(currentLayer);
                            this._uiBuildBackPanel.addChild(this._uiBuildTowerLayer);
                            this._background.getLayer("buildArea").setVisible(true);
                            var autoButton = this._findAutoHighlightButton();
                            if (autoButton !== null) {
                                this._selected = autoButton;
                                this._highlightObject(autoButton.button);
                                this._buildTowerId = autoButton.id;
                                break;
                            }
                        } else if (buttonId === -3) {
                            cc.director.runScene(new StageSelectScene());
                        } else if (buttonId === -4) {
                            this._startNextWave();
                        }
                    } else if (currentLayer.getName() == "buildTowerLayer") {
                        if (buttonId === -1) {
                            this._background.getLayer("buildArea").setVisible(false);
                            this._selected = null;
                            this._stopHighlightAction();
                            this._buildTowerId = 0;
                            this._uiBuildBackPanel.removeChild(currentLayer);
                            this._uiBuildBackPanel.addChild(this._uiBuildLayer);
                            break;
                        } else {
                            if (this._highlightedObject !== this._buttons[i].button) {
                                this._selected = this._buttons[i];
                                this._highlightObject(this._buttons[i].button);
                                this._buildTowerId = buttonId;
                            }
                        }
                    } else if (currentLayer.getName() == "upgradeLayer") {
                        if (buttonId === -1) {
                            this._stopHighlightAction();
                            this._selected.toggleRangeDisplay();
                            this._uiBuildBackPanel.removeChild(currentLayer);
                            this._uiBuildBackPanel.addChild(this._uiBuildLayer);
                            this._selected = null;
                            break;
                        } else if (buttonId === -2) {
                            this._removeButtonsFromArray(currentLayer);
                            currentLayer.removeFromParent(true);
                            this._uiBuildBackPanel.addChild(this._uiBuildLayer);
                            this._selected.unitKilled();
                            break;
                        } else {
                            var upgradeData = global.towerList[buttonId];
                            this._removeAuraBuffs(this._selected);
                            this._selected.upgradeTower(upgradeData);
                            this._updateResources((-1)*this._selected.getCost(), (-1)*this._selected.getSpecialCost());
                            var newUpgradeLayer = this._createUiBuildUpgradeLayer(this._selected.getId());
                            for (var i = 0, len = this._towers.length; i < len; i = (i + 1) | 0) {
                                if (this._towers[i].tower === this._selected) {
                                    this._towers[i].layer = newUpgradeLayer;
                                }
                            }
                            this._removeButtonsFromArray(currentLayer);
                            this._uiBuildBackPanel.removeChild(currentLayer, true);
                            this._uiBuildBackPanel.addChild(newUpgradeLayer, 1);
                            break;
                        }
                    }
                }
            }
        }
        else if ($loc.x < mapWidth) {
            var locX = $loc.x;
            var locY = mapHeight - $loc.y;
            var posX = Math.floor(locX / tileWidth);
            var posY = Math.floor(locY / tileWidth);
            if (this._buildTowerId !== 0) {
                this._handleBuild(posX, posY);
            } else if (currentLayer.getName() !== "buildTowerLayer") {
                if (this._checkTowerClick(locX, $loc.y)) {
                    currentLayer.removeFromParent();
                    this._uiBuildBackPanel.addChild(this._findTowerInArray(this._selected).layer, 1);
                }
                else if (this._checkCreepClick(locX, $loc.y)) {
                    currentLayer.removeFromParent();
                    this._uiBuildBackPanel.addChild(this._uiBuildLayer);
                }
                else if (currentLayer.getName() !== "buildLayer" || (currentLayer.getName() === "buildLayer" && this._selected instanceof Creep)) {
                    if (this._selected instanceof Tower) this._selected.toggleRangeDisplay();
                    this._selected = null;
                    this._stopHighlightAction();
                    this._uiBuildBackPanel.removeChild(currentLayer);
                    this._uiBuildBackPanel.addChild(this._uiBuildLayer);
                }
            }
        }
        if (this._selected) {
            var layer = (this._selected instanceof Unit) ? this._selected.getInfoPanel() : null;
            if (!layer) return;
            if (!this._uiInfoBackPanel.getChildren()[0]) this._uiInfoBackPanel.addChild(layer,1);
            if (this._uiInfoBackPanel.getChildren()[0] !== layer) {
                this._uiInfoBackPanel.getChildren()[0].removeFromParent();
                this._uiInfoBackPanel.addChild(layer,1);
            }
        } else if (!this._resultFlag) {
            if (this._uiInfoBackPanel.getChildren().length > 0) {
                this._uiInfoBackPanel.removeAllChildren();
            }
            if (this._first) this._uiInfoBackPanel.addChild(this._ruleLayer, 1);
            if (this._waveNumber + 1 === 7) this._uiInfoBackPanel.addChild(this._specialWaveInfo, 1);
        }
    },

    _handleBuild: function ($x, $y) {
        var buildPos = this._getTileValues($x, $y);
        if (buildPos.x === -1 && buildPos.y === -1 || cc.isUndefined(buildPos)) {
            this._createErrorMessage("Can't build there", true);
            return;
        }
        var tower = this._createTower(buildPos.x, buildPos.y, this._buildTowerId);
        var upgradeLayer = this._createUiBuildUpgradeLayer(tower.getId());
        this._towers.push({tower: tower, tilePos: buildPos, layer: upgradeLayer});
    },

    _checkCreepClick: function ($x, $y) {
        var found = false;
        this._creeps.forEach(function (creep) {
            var xPos = creep.getPositionX();
            var yPos = creep.getPositionY();

            if ($x >= xPos - TILE_SIZE && $x <= xPos + TILE_SIZE && $y >= yPos - TILE_SIZE && $y <= yPos + TILE_SIZE) {
                if (this._selected instanceof Tower) this._selected.toggleRangeDisplay();
                this._selected = creep;
                if (this._highlightedObject !== creep.getImage()) this._highlightObject(creep.getImage());
                found = true;
            }
        }, this);
        return found;
    },

    _checkTowerClick: function ($x, $y) {
        var selected = [];
        this._towers.forEach(function (element) {
            var tower = element.tower;
            var xPos = tower.getPositionX();
            var yPos = tower.getPositionY();

            if ($x >= xPos - TILE_SIZE && $x <= xPos + TILE_SIZE && $y >= yPos && $y <= yPos + TILE_SIZE*4) {
                selected.push(tower);
            }
        });
        if (selected.length > 1) selected.sort(function (a, b) {
            return b.getLocalZOrder() - a.getLocalZOrder();
        });
        if (selected[0]) {
            if (this._selected instanceof Tower) this._selected.toggleRangeDisplay();
            this._selected = selected[0];
            this._selected.toggleRangeDisplay();
            if (this._highlightedObject !== this._selected.getImage()) this._highlightObject(this._selected.getImage());
            return true;
        }
        return false;
    },

    _removeButtonsFromArray: function ($layer) {
        var children = $layer.getChildren();
        for (var i = 0, len = children.length; i < len; i = (i + 1)| 0) {
            if (children[i] instanceof cc.Scale9Sprite) {
                this._buttons = this._buttons.filter(function(e) {
                    return e.button !== children[i];
                });
            }
        }
    },

    _removeTowerFromArray: function ($tower) {
        this._towers = this._towers.filter(function(e) {
            return e !== $tower;
        });
    },

    _findTowerInArray: function ($tower) {
        var tower = this._towers.find(function (e) {
            return e.tower === $tower;
        });
        return tower;
    },

    _findButtonInArray: function ($button) {
        var button = this._buttons.find(function (e) {
            return e.button === $button;
        });
        return button;
    },

    _findAutoHighlightButton: function () {
        var buttons = this._uiBuildTowerLayer.getChildren();
        for (var i = 0, len = buttons.length; i < len; i = (i + 1) | 0) {
            var button = this._findButtonInArray(buttons[i]);
            if (button.id === 0 || button.id === -1) continue;
            if (!this._checkHasMask(button.button)) {
                return button;
            } else {
                return null;
            }
        }
    },

    _highlightObject: function ($object) {
        this._stopHighlightAction();
        this._highlightedObject = $object;
        this._highlightAction = $object.runAction(cc.repeatForever(cc.sequence(cc.tintTo(1, 253, 255, 31), cc.tintTo(1, 255, 255, 255))));
    },

    _stopHighlightAction: function () {
        if (this._highlightAction) {
            this._highlightedObject.stopAction(this._highlightAction);
            this._highlightedObject.setColor(cc.color(255,255,255));
            this._highlightedObject = null;
            this._highlightAction = null;
        }
    },

    _calculateDamage: function ($source, $target) {
        if ($source.getAtkType() === ATTACK_TYPES.PURE) return $source.getAtk();
        var typeMulti = this._calcTypeMulti($source.getAtkType(), $target.getArmourType());
        if (cc.isUndefined(typeMulti) || $source instanceof Skill) typeMulti = 1;
        var multipliedAtk = typeMulti * $source.getAtk();
        var damageReduction = this._calcReduction($target.getArmour());
        if (cc.isUndefined(damageReduction)) damageReduction = 0;
        var reducedDamage = this._calcDamage(multipliedAtk, damageReduction);
        if (cc.isUndefined(reducedDamage)) reducedDamage = multipliedAtk;
        var elementMulti = this._calcElementMulti($source.getElement(), $target.getElement());
        if (cc.isUndefined(elementMulti) || ($source instanceof Skill && $source.getElement() === ELEMENTS.NONE)) elementMulti = 1;
        var totalDamage = elementMulti * reducedDamage;
        return totalDamage;
    },

    _calcReduction: function ($armour) {
        return ($armour < 0)   ?     2 - Math.pow(1 - ARMOUR_DAMAGE_REDUCTION_MULTIPLIER, ($armour * -1))
            :     ($armour * ARMOUR_DAMAGE_REDUCTION_MULTIPLIER) / (1 + ($armour * ARMOUR_DAMAGE_REDUCTION_MULTIPLIER));
    },

    _calcTypeMulti: function ($sourceType, $targetType) {
        return TYPE_MULTIPLIER[$sourceType][$targetType];
    },

    _calcElementMulti: function ($sourceElement, $targetElement) {
        return ELEMENT_MULTIPLIER[$sourceElement][$targetElement];
    },

    _calcDamage: function ($atk, $reduction) {
        return ($reduction <= 1) ? $atk - ($reduction * $atk) : $atk * $reduction;
    },
});

var ResultLayer = cc.Layer.extend({
    _back: null,
    _buttons: null,
    _rewards: null,
    ctor: function ($win, $lives, $totalLives, $wave, $totalWaves, $gold, $crystals, $enemiesDefeated, $enemyTotal, $specialDefeated, $specialTotal) {
        this._super();
        this._rewards = [];
        this._buttons = [];
        this._createSkeleton($win, $lives, $totalLives, $wave, $totalWaves, $gold, $crystals, $enemiesDefeated, $enemyTotal, $specialDefeated, $specialTotal);
        ($win) ? this._createWinLayer() : this._createLossLayer();
    },

    _createSkeleton: function ($win, $lives, $totalLives, $wave, $totalWaves, $gold, $crystals, $enemiesDefeated, $enemyTotal, $specialDefeated, $specialTotal) {
        var backPanel = this._back = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        ($win) ? backPanel.setContentSize(300, 400) : backPanel.setContentSize(300, 250);
        backPanel.setColor(cc.color(128,128,128));
        this.addChild(backPanel, 0);

        var clearString = "";
        if (!$win) clearString += "完成ウェーブ数:";
        if ($win) clearString += "\n残りライフ:";
        clearString += "\n累計獲得ゴールド:";
        if ($specialTotal > 0) clearString += "\n累計獲得クリスタル:"
        clearString += "\n倒した敵数:";
        if ($specialTotal > 0) clearString += "\n倒した特敵数:";

        var valuesString = "";
        if (!$win) valuesString += $wave+"/"+$totalWaves;
        if ($win) valuesString += "\n"+$lives+"/"+$totalLives;
        valuesString += "\n"+$gold;
        if ($specialTotal > 0) valuesString += "\n"+$crystals;
        valuesString += "\n"+$enemiesDefeated+"/"+$enemyTotal;
        if ($specialTotal > 0) valuesString += "\n"+$specialDefeated+"/"+$specialTotal;

        var posY = ($win) ? this._back.getContentSize().height/2 - 50 : this._back.getContentSize().height/2 - 20;

        var values = new cc.LabelTTF(valuesString, "Arial", 16);
        values.setDimensions(this._back.getContentSize().width - 40, 150);
        values.setHorizontalAlignment(cc.TEXT_ALIGNMENT_RIGHT);
        values.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        values.setPosition(this._back.getContentSize().width / 2, posY);

        var clearDetails = new cc.LabelTTF(clearString, "Arial", 16);
        clearDetails.setDimensions(this._back.getContentSize().width - 40, 150);
        clearDetails.setHorizontalAlignment(cc.TEXT_ALIGNMENT_LEFT);
        clearDetails.setVerticalAlignment(cc.VERTICAL_TEXT_ALIGNMENT_TOP);
        clearDetails.setPosition(this._back.getContentSize().width / 2, posY);

        var titleLabel = new cc.LabelTTF("", "Arial", 32);
        titleLabel.setPosition(this._back.getContentSize().width/2, this._back.getContentSize().height - 40);
        titleLabel.setName("title");

        this._back.addChild(titleLabel, 1);
        this._back.addChild(values, 1);
        this._back.addChild(clearDetails, 1);
    },

    _createLossLayer: function () {
        var titleLabel = this._back.getChildByName("title");
        titleLabel.setString("FAILURE");

        var retryButton = this._createButton("Retry", 1, this._back.getContentSize().width /2 - 45, 35);

        var exitButton = this._createButton("Exit", 2, cc.pAdd(retryButton.getPosition(), cc.p(90, 0)));

        this._back.addChild(retryButton, 1);
        this._back.addChild(exitButton, 1);

        this._buttons.push(retryButton);
        this._buttons.push(exitButton);
    },

    _createWinLayer: function () {
        var titleLabel = this._back.getChildByName("title");
        titleLabel.setString("SUCCESS");

        var rewardLabel = new cc.LabelTTF("Rewards:", "Arial", 24);
        rewardLabel.setPosition(cc.pSub(titleLabel.getPosition(), cc.p(0, 40)));
        rewardLabel.setName("reward");

        var exitButton = this._createButton("Exit", 2, this._back.getContentSize().width /2, 40);

        this._back.addChild(rewardLabel, 1);
        this._back.addChild(exitButton, 1);
        this._buttons.push(exitButton);
    },

    _createButton: function ($string, $tag, $posX, $posY) {
        var button = new cc.Scale9Sprite(res.block, cc.rect(0, 0, 40, 40), cc.rect(15, 15, 10, 10));
        button.setContentSize(80, 50);
        (!cc.isUndefined($posY)) ? button.setPosition($posX, $posY) : button.setPosition($posX);

        var label = new cc.LabelTTF($string, "Arial", 20);
        label.setPosition(button.getContentSize().width / 2, button.getContentSize().height / 2);
        label.setColor(cc.color(0,0,0));

        button.addChild(label, 1);
        button.setTag($tag);

        return button;
    },

    addReward: function ($string, $amount) {
        this._rewards.push((!cc.isUndefined($amount)) ? $string + " x " + $amount : $string);
    },

    drawRewardLabels: function () {
        var rTitleLabel = this._back.getChildByName("reward");
        for (var i = 0, len = this._rewards.length; i < len; i = (i + 1) | 0) {
            var reward = this._rewards[i];
            var rewardLabel = new cc.LabelTTF(reward, "Arial", 16);
            rewardLabel.setPosition(cc.pSub(rTitleLabel.getPosition(), cc.p(0, 30*(i+1))));
            this._back.addChild(rewardLabel, 1);
        }
        return true;
    },

    getButtons: function () {
        return this._buttons;
    }
});


var Unit = cc.Node.extend({
    _resLoc: "",
    _id: -1,
    _name: "",
    _element: ELEMENTS.NONE,
    _armourType: ARMOUR_TYPES.NONE,
    _atkType: ATTACK_TYPES.NORMAL,
    _hp: 0,
    _maxHp: 0,
    _atk: 0,
    _armour: 0,
    _modArmour: 0,
    _atkSpeed: 0,
    _atkCd: -1,
    _atkRange: 0,
    _multiAtk: false,
    _projectileAtk: true,
    _activeSkills: null,
    _passiveSkills: null,
    _image: null,
    _currentAction: null,
    _delegate: null,
    _destroyByPlayer: false,
    _hpAnimation: null,
    _currentHit: 0,
    _infoPanel: null,
    _tex: null,
    _stunned: false,
    _projId: 1,
    _effectId: 0,
    ctor: function ($resLoc, $id) {
        this._super();
        this._resLoc = $resLoc;
        this._id = $id;
        this._name = this._data.name || "Default";
        this._element = ELEMENTS[this._data.element] || ELEMENTS.NONE;
        this._armourType = ARMOUR_TYPES[this._data.armourType] || ARMOUR_TYPES.NONE;
        this._atkType = ATTACK_TYPES[this._data.atkType] || ATTACK_TYPES.NORMAL;
        this._hp = parseInt(this._data.hp) || 100;
        this._maxHp = parseInt(this._data.hp) || 100;
        this._atk = parseInt(this._data.atk) || 1;
        this._armour = parseInt(this._data.armour) || 0;
        this._atkSpeed = parseInt(this._data.atkSpeed) || 1.5;
        this._atkRange = parseInt(this._data.atkRange) || 100;
        this._multiAtk = (parseInt(this._data.multi) === 1) ? true : false;
        this._projectileAtk = (parseInt(this._data.projectileAtk) === 0) ? false : true;
        this._projId = this._data.projId || 1;
        this._effectId = this._data.effectId || 0;
        this._createSkillArray();
        this._image = new cc.Sprite();
        this._image.setPosition(this.width/2, this.height/2);
        this.addChild(this._image, 1);
    },

    initUnitTexture: function ($isUpdate) {
        cc.loader.load(this._resLoc, function() {
            var tex = this._tex = cc.textureCache.getTextureForKey(this._resLoc);
            this._image.setTexture(tex);
            if (!$isUpdate) {
                this._atkCd = 0;
                this._setInfoImage()
            } else {
                this._updateInfoImage();
            }
        }.bind(this));
    },

    getName: function () {
        return this._name;
    },

    getImage: function () {
        return this._image;
    },

    getId: function () {
        return this._id;
    },

    getAtk: function () {
        return this._atk;
    },

    getArmour: function () {
        return this._armour;
    },

    getProjId: function () {
        return this._projId;
    },

    getEffectId: function () {
        return this._effectId;
    },

    buffArmour: function ($value) {
        this._modArmour += $value;
        this._armour += $value;
        this._updateInfoArmour();
    },

    getAtkType: function () {
        return this._atkType;
    },

    getArmourType: function () {
        return this._armourType;
    },

    getAtkRange: function () {
        return this._atkRange;
    },

    getAtkSpeed: function () {
        return this._atkSpeed;
    },

    getAtkCd: function () {
        return this._atkCd;
    },

    setAtkCd: function ($cd) {
        this._atkCd = $cd;
    },

    getElement: function () {
        return this._element;
    },

    getInfoPanel: function () {
        return this._infoPanel;
    },

    getActiveSkills: function () {
        return this._activeSkills;
    },

    getPassiveSkills: function () {
        return this._passiveSkills;
    },

    isMultiAtk: function () {
        return this._multiAtk;
    },

    isProjAtk: function () {
        return this._projectileAtk;
    },

    isStunned: function () {
        return this._stunned;
    },

    setStunned: function ($stunned) {
        this._stunned = $stunned;
        if (this instanceof Creep) {
            this._frame = 1;
            this.setTextureFrame()
        }
    },

    damage: function ($damage) {
        if (this._hp === 0) return;
        this._hp -= $damage;
        if (this._hp <= 0) this._hp = 0;
        var hpLabel = (this._infoPanel) ? this._infoPanel.getChildByName("hp") : null;
        if (hpLabel) {
            hpLabel.setString(""+Math.floor(this._hp)+" / "+this._maxHp);
        }
        this._hpBar.setScaleX(this._hp/this._maxHp * 16);
        this._animateHpBar();
        if (this._hp === 0) {
            this._stopAnimation();
            this.setPlayerDestroy(true);
            this.unitKilled();
        }
    },

    _createSkillArray: function () {
        this._activeSkills = [];
        this._passiveSkills = [];
        if (this._data.skills === "") return;
        var skillString = ""+this._data.skills;
        var spliced = skillString.split(",");

        for (var i = 0, len = spliced.length; i < len; i = (i+1) | 0) {
            var skillId = parseInt(spliced[i]);
            var skill = new Skill(skillId);
            (skill.getType() === SKILL_TYPES.ACTIVE) ? this._activeSkills.push(skill) : this._passiveSkills.push(skill);
        }
    },

    _animateHpBar: function () {
        this._stopAnimation;
        this._currentHit = this._hpBar.getScaleX();
        this._hpAnimation = this._redPlate.runAction(cc.sequence(cc.delayTime(0.3), cc.scaleTo(0.3, this._currentHit, 0.2)));
    },

    _stopAnimation: function () {
        if (this._hpAnimation) {
            this._redPlate.setScaleX(this._currentHit);
            this._redPlate.stopAction(this._hpAnimation);
            this._hpAnimation = null;
        }
    },

    unitKilled: function () {
        if (this._delegate && cc.isFunction(this._delegate.unitKilled)) {
            this._delegate.unitKilled(this);
        }
    },

    setPlayerDestroy: function ($isPlayerDestroy) {
        this._destroyByPlayer = $isPlayerDestroy;
    },

    isPlayerDestroy: function () {
        return this._destroyByPlayer;
    },

    setDelegate: function ($obj) {
        this._delegate = $obj;
    },

    _updateData: function($data) {
        this._id = $data.id;
        this._resLoc = "res/sprites/unitSprites/towers/tower_"+zeroPadding(this._id,4)+".png";
        this.initUnitTexture(true);
        this._name = $data.name;
        this._element = ELEMENTS[$data.element];
        this._armourType = ARMOUR_TYPES[$data.armourType];
        this._atkType = ATTACK_TYPES[$data.attackType];
        this._hp = parseInt($data.hp);
        this._maxHp = parseInt($data.hp);
        this._atk = parseInt($data.atk);
        this._armour = parseInt($data.armour);
        if (this._modArmour) this._armour += this._modArmour;
        this._atkSpeed = parseInt($data.atkSpeed);
        this._atkRange = parseInt($data.atkRange);
        this._multiAtk = (parseInt($data.multi) === 1) ? true : false;
        this._projectileAtk = (parseInt($data.projectileAtk) === 0) ? false : true;
        this._projId = $data.projId || 1;
        this._effectId = this._data.effectId || 0;
        this._createSkillArray();
        this._updateInfoPanel();
    },

    _createInfoPanel: function($image) {
        var info = this._infoPanel = new cc.Layer();
        info.setContentSize(BUILD_UI_WIDTH, BUILD_UI_HEIGHT);

        var nameLabel = new cc.LabelTTF(""+this._name, "Arial", 20);
        var hpTitleLabel = new cc.LabelTTF("HP:", "Arial", 15);
        var hpLabel = new cc.LabelTTF(""+Math.floor(this._hp)+" / "+this._maxHp, "Arial", 15);

        var elementTitleLabel = new cc.LabelTTF("Element:", "Arial", 15);
        var elementLabel = new cc.LabelTTF(""+returnProperString(this._data.element), "Arial", 15);
        var colour = colourText(this._element);
        elementLabel.setFontFillColor(colour);

        var atkTitleLabel = new cc.LabelTTF("Attack:", "Arial", 15);
        var atkLabel = new cc.LabelTTF(""+this._atk + " ("+returnProperString(this._data.attackType)+")", "Arial", 15);

        var atkRangeTitleLabel = new cc.LabelTTF("Atk Range:", "Arial", 15);
        var atkRangeLabel = new cc.LabelTTF(""+this._atkRange, "Arial", 15);

        var atkSpeedTitleLabel = new cc.LabelTTF("Atk Speed:", "Arial", 15);
        var atkSpeedLabel = new cc.LabelTTF(""+this._atkSpeed, "Arial", 15);

        var atkTypeTitleLabel = new cc.LabelTTF("Atk Type:", "Arial", 15);
        var atkTypeLabelString = "";
        if (this.isProjAtk()) {
            atkTypeLabelString += (this.isMultiAtk()) ? "Multi" : "Single";
        } else {
            atkTypeLabelString += (this.isMultiAtk()) ? "AOE" : "Instant";
        }
        var atkTypeLabel = new cc.LabelTTF(atkTypeLabelString, "Arial", 15);

        var armourTitleLabel = new cc.LabelTTF("Armour:", "Arial", 15);
        var armourLabel = new cc.LabelTTF("", "Arial", 15);

        var image = $image;

        nameLabel.setName("name");
        hpLabel.setName("hp");
        image.setName("image");
        elementLabel.setName("element");
        armourTitleLabel.setName("armourTitle");
        atkLabel.setName("atk");
        atkRangeLabel.setName("atkRange");
        atkSpeedLabel.setName("atkSpeed");
        atkTypeLabel.setName("atkType");
        armourLabel.setName("armour");

        info.addChild(nameLabel, 1);
        info.addChild(image, 1);
        info.addChild(hpTitleLabel);
        info.addChild(hpLabel);
        info.addChild(elementTitleLabel);
        info.addChild(elementLabel);
        info.addChild(atkTitleLabel);
        info.addChild(atkLabel);
        info.addChild(atkRangeTitleLabel);
        info.addChild(atkRangeLabel);
        info.addChild(atkSpeedTitleLabel);
        info.addChild(atkSpeedLabel);
        info.addChild(atkTypeLabel);
        info.addChild(atkTypeTitleLabel);
        info.addChild(armourLabel);
        info.addChild(armourTitleLabel);

        this._updateInfoArmour();

        nameLabel.setPosition(BUILD_UI_WIDTH / 2, BUILD_UI_HEIGHT - 25);
        hpTitleLabel.setPosition(BUILD_UI_WIDTH / 2 - 20, BUILD_UI_HEIGHT / 2 + 50);
        hpLabel.setPosition(cc.pAdd(hpTitleLabel.getPosition(), cc.p(90, 0)));
        image.setPosition(TILE_SIZE*2 + 20, BUILD_UI_HEIGHT / 2);
        elementTitleLabel.setPosition(cc.pAdd(hpTitleLabel.getPosition(), cc.p(-15, -20)));
        elementLabel.setPosition(cc.pAdd(hpLabel.getPosition(), cc.p(0, -20)));
        atkTitleLabel.setPosition(cc.pAdd(elementTitleLabel.getPosition(), cc.p(0, -20)));
        atkRangeTitleLabel.setPosition(cc.pAdd(atkTitleLabel.getPosition(), cc.p(0, -20)));
        atkSpeedTitleLabel.setPosition(cc.pAdd(atkRangeTitleLabel.getPosition(), cc.p(0, -20)));
        atkTypeTitleLabel.setPosition(cc.pAdd(atkSpeedTitleLabel.getPosition(), cc.p(0, -20)));
        armourTitleLabel.setPosition(cc.pAdd(atkTypeTitleLabel.getPosition(), cc.p(0, -20)));
        atkLabel.setPosition(cc.pAdd(elementLabel.getPosition(), cc.p(0, -20)));
        atkRangeLabel.setPosition(cc.pAdd(atkLabel.getPosition(), cc.p(0, -20)));
        atkSpeedLabel.setPosition(cc.pAdd(atkRangeLabel.getPosition(), cc.p(0, -20)));
        atkTypeLabel.setPosition(cc.pAdd(atkSpeedLabel.getPosition(), cc.p(0, -20)));
        armourLabel.setPosition(cc.pAdd(atkTypeLabel.getPosition(), cc.p(0, -20)));
    },

    _updateInfoPanel: function () {
        var nameLabel = this._infoPanel.getChildByName("name");
        nameLabel.setString(""+this._name);

        var hpLabel = this._infoPanel.getChildByName("hp");
        hpLabel.setString(""+Math.floor(this._hp)+" / "+this._maxHp);

        var elementLabel = this._infoPanel.getChildByName("element");
        elementLabel.setString(""+returnProperString(this._data.element));
        var colour = colourText(this._element);
        elementLabel.setFontFillColor(colour);

        var atkLabel = this._infoPanel.getChildByName("atk");
        atkLabel.setString(""+this._atk + " ("+returnProperString(this._data.attackType)+ ")");

        var atkRangeLabel = this._infoPanel.getChildByName("atkRange");
        atkRangeLabel.setString(""+this._atkRange);

        var atkSpeedLabel = this._infoPanel.getChildByName("atkSpeed");
        atkSpeedLabel.setString(""+this._atkSpeed);

        var atkTypeLabel = this._infoPanel.getChildByName("atkType");
        var atkTypeLabelString = "";
        if (this.isProjAtk()) {
            atkTypeLabelString += (this.isMultiAtk()) ? "Multi" : "Single";
        } else {
            atkTypeLabelString += (this.isMultiAtk()) ? "AOE" : "Instant";
        }
        atkTypeLabel.setString(atkTypeLabelString);

        this._updateInfoArmour();

        var sellLabel = this._infoPanel.getChildByName("sell");
        sellLabel.setString("Sell: "+this._totalCost*0.5);
    },

    _setInfoImage: function () {
        var image = new cc.Sprite();
        image.setTexture(this._tex);
        image.setScale(2,2);
        this._createInfoPanel(image);
    },

    _updateInfoImage: function () {
        var image = this._infoPanel.getChildByName("image");
        image.setTexture(this._tex);
    },

    _updateInfoArmour: function () {
        if (this._infoPanel) {
            var armourLabel = this._infoPanel.getChildByName("armour");
            var armourString = ""+this._armour;
            // if (this._modArmour < 0) armourString.fontcolor(cc.color(255,0,0));
            // if (this._modArmour > 0) armourString.fontcolor(cc.color(0x15, 0xFF, 0x00));


            var armourTypeString = " ("+returnProperString(this._data.armourType)+ ") ";

            var armourModString = "";
            if (this._modArmour !== 0) {
                (this._modArmour < 0) ? armourModString += "-" : armourModString += "+";
                armourModString += Math.abs(this._modArmour);
            }

            armourLabel.setString(armourString + armourTypeString + armourModString);
        }
    },
});

var Tower = Unit.extend({
    _data: null,
    _level: -1,
    _towersRequired: null,
    _itemsRequired: null,
    _cost: -1,
    _specialCost: -1,
    _totalCost: -1,
    _debugRange: null,
    ctor: function($id) {
        this._data = global.towerList[$id];
        this._super("res/sprites/unitSprites/towers/tower_"+zeroPadding($id,4)+".png", $id);
        this._level = this._data.level || 1;
        this._towersRequired = createArray(this._data.requiredTowerId);
        this._itemsRequired = createArray(this._data.requiredItemId);
        this._cost = this._data.cost || 0;
        this._specialCost = this._data.specialCost || 0;
        this._totalCost = this._data.cost || 0;
        this._image.setPosition(cc.pAdd(this.getPosition(),cc.p(0,32)));
        var debugRange = this._debugRange =  new cc.DrawNode();
        debugRange.setLocalZOrder(0);
        this.updateDebugRange();
        this.addChild(debugRange);
        debugRange.setVisible(false);
    },

    getCost: function () {
        return this._cost;
    },

    getSpecialCost: function () {
        return this._specialCost;
    },

    getTotalCost: function () {
        return this._totalCost;
    },

    toggleRangeDisplay: function () {
        this._debugRange.setVisible(!this._debugRange.isVisible());
    },

    updateDebugRange: function () {
        this._debugRange.clear();
        this._debugRange.drawDot(cc.p(0,16),this._atkRange,cc.color(255,0,0,64));
        this._debugRange.setContentSize(this._atkRange,this._atkRange);
    },

    upgradeTower: function ($data) {;
            this._data = $data;
            this._level = $data.level;
            this._towersRequired = createArray(this._data.requiredTowerId);
            this._itemsRequired = createArray(this._data.requiredItemId);
            this._cost = $data.cost;
            this._specialCost = $data.specialCost;
            this._totalCost += $data.cost || 0;
            this._updateData($data);
            this.updateDebugRange();
    },

    _createInfoPanel: function ($image) {
        this._super($image);
        var sellLabel = new cc.LabelTTF("Sell: "+this._totalCost*0.5, "Arial", 15);
        sellLabel.setPosition(BUILD_UI_WIDTH - 35, 15);
        sellLabel.setName("sell");
        sellLabel.setFontFillColor(cc.color(253, 255, 31));

        this._infoPanel.addChild(sellLabel);
    }
});

var Creep = Unit.extend({
    _data: null,
    _currentPathIndex: 0,
    _moveSpeed: 0,
    _speedVector: null,
    _direction: 0,
    _frame: 0,
    _frameTime: 0,
    _dest: null,
    _start: null,
    _killVal_gold: 0,
    _killVal_crystals: 0,
    _moveFlag: false,
    _moveTime: 0,
    _hpBar: null,
    _redPlate: null,
    ctor: function($id, $killVal) {
        this._data = global.creepList[$id];
        this._super("res/sprites/unitSprites/creeps/creep_"+zeroPadding($id,3)+".png", $id);
        this._moveSpeed = parseInt(this._data.moveSpeed);
        this._direction = DIRECTION.DOWN;
        this._speedVector = {x:0, y:0};
        this.setSpeedVector(this._direction);
        this._dest = {x:0, y:0};
        this._start = {x:0, y:0};
        this._killVal_gold = parseInt($killVal.gold);
        this._killVal_crystals = parseInt($killVal.crystals) || 0;
    },

    initUnitTexture: function () {
        cc.loader.load(this._resLoc, function () {
            var tex = this._tex = cc.textureCache.getTextureForKey(this._resLoc);
            this._image.setTexture(tex);
            this.setTextureFrame();
            this._setInfoImage();
        }.bind(this));

        var hpBack = new cc.Sprite(res.hpBar);
        hpBack.setPosition(cc.p(-16, 35));
        hpBack.setAnchorPoint(cc.p(0, 0.5));
        hpBack.setScaleX(this._hp / this._maxHp * 16);
        hpBack.setScaleY(0.2);
        hpBack.setColor(cc.color(0x12, 0xA5, 0x05));
        this.addChild(hpBack, 1);

        this._redPlate = new cc.Sprite(res.hpBar);
        this._redPlate.setPosition(cc.p(-16, 35));
        this._redPlate.setAnchorPoint(cc.p(0, 0.5));
        this._redPlate.setScaleX(this._hp / this._maxHp * 16);
        this._redPlate.setScaleY(0.2);
        this._redPlate.setColor(cc.color(0xFF, 0x00, 0x00))
        this.addChild(this._redPlate, 1);

        this._hpBar = new cc.Sprite(res.hpBar);
        this._hpBar.setPosition(cc.p(-16, 35));
        this._hpBar.setAnchorPoint(cc.p(0, 0.5));
        this._hpBar.setScaleX(this._hp /this._maxHp * 16);
        this._hpBar.setScaleY(0.2);
        this._hpBar.setColor(cc.color(0x15, 0xFF, 0x00));
        this.addChild(this._hpBar, 1);
    },

    setPathIndex: function ($index) {
        this._currentPathIndex = $index;
    },

    setTextureFrame: function () {
        this._image.setTextureRect(selector[this._direction][this._frame]);
    },

    setCreepDirection: function ($direction) {
        this._direction = $direction;
        this._frame = 0;
        this.setTextureFrame();
    },

    setSpeedVector: function ($direction) {
        switch ($direction) {
            case DIRECTION.DOWN:
                this._speedVector = {x: 0, y: -this._moveSpeed};
                break;

            case DIRECTION.RIGHT:
                this._speedVector = {x: this._moveSpeed, y: 0};
                break;

            case DIRECTION.LEFT:
                this._speedVector = {x: -this._moveSpeed, y: 0};
                break;

            case DIRECTION.UP:
                this._speedVector = {x: 0, y: this._moveSpeed};
                break;

            default:
                break;
        }
    },

    setFrameTime: function ($t) {
        this._frameTime = $t;
    },

    getSpeedVector: function () {
        return this._speedVector;
    },

    getMoveSpeed: function () {
        return this._moveSpeed;
    },

    setMoveSpeed: function ($speed) {
        this._moveSpeed += $speed;
        this.setSpeedVector(this._direction);
        this._moveTime = 0;
        this.moveOrder();
        this._updateMsLabel();
    },

    getPathIndex: function () {
        return this._currentPathIndex;
    },

    getFrameTime: function () {
        return this._frameTime;
    },

    getStartPos: function () {
        return this._start;
    },

    getDestPos: function () {
        return this._dest;
    },

    getRewardGold: function () {
        return this._killVal_gold;
    },

    getRewardCrystals: function () {
        return this._killVal_crystals;
    },

    isMoveOrder: function () {
        return this._moveFlag;
    },

    incrementFrame: function () {
        this._frame++;
        if (this._frame > 2) this._frame = 0;
    },

    moveOrder: function ($dest) {
        this._moveFlag = true;
        this._start.x = this.getPositionX();
        this._start.y = this.getPositionY();
        if (!cc.isUndefined($dest)) this._dest = $dest;
    },

    endMove: function () {
        this._moveFlag = false;
        this._moveTime = 0;
        if (this._delegate && cc.isFunction(this._delegate.moveEnded)) {
            this._delegate.moveEnded(this);
        }
    },

    moveTo: function ($speed, $startPos, $destPos, $dt) {
        var duration = ($destPos - $startPos) / $speed;
        this._moveTime += $dt;
        var t = this._moveTime / duration;
        t = Math.min(1, Math.max(0, t));
        var currentPos = $startPos + t * ($destPos - $startPos);
        return {pos: currentPos, t: t};
    },

    _setInfoImage: function () {
        var image = new cc.Sprite();
        image.setTexture(this._tex);
        image.setTextureRect(selector[DIRECTION.DOWN][1])
        image.setScale(2,2);
        this._createInfoPanel(image);
    },

    _createInfoPanel: function ($image) {
        this._super($image);

        var movespeedTitleLabel = new cc.LabelTTF("Movespeed:", "Arial", 15);
        var movespeedLabel = new cc.LabelTTF(""+Math.floor(this._moveSpeed), "Arial", 15);

        movespeedTitleLabel.setPosition(cc.pAdd(this._infoPanel.getChildByName("armourTitle").getPosition(), cc.p(0, -20)));
        movespeedLabel.setPosition(cc.pAdd(this._infoPanel.getChildByName("armour").getPosition(), cc.p(0, -20)));

        movespeedLabel.setName("movespeed");

        this._infoPanel.addChild(movespeedTitleLabel);
        this._infoPanel.addChild(movespeedLabel);
    },

    _updateMsLabel: function() {
        if (this._infoPanel) {
            var msLabel = this._infoPanel.getChildByName("movespeed");
            msLabel.setString(""+Math.floor(this._moveSpeed), "Arial", 15);
        }
    }
});

var Skill = cc.Class.extend({
    _data: null,
    _id: -1,
    _name: "",
    _description: "",
    _type: -1,
    _hidden: false,
    _buffId: null,
    _value: null,
    _duration: null,
    _buffStacks: null,
    _atk: 0,
    _damageType: -1,
    _element: -1,
    _aoe: 0,
    _cd: 0,
    _usedCd: 0,
    _targetType: -1,
    ctor: function ($id) {
        this._data = global.skillList[$id];
        this._id = this._data.id;
        this._name = this._data.name || "Default";
        this._description = this._data.description || "Default";
        this._type = SKILL_TYPES[this._data.type];
        this._hidden = (this._data.hidden === 0) ? false : true || false;
        this._buffId = createArray(this._data.buffId);
        this._value = createArray(this._data.value);
        this._duration = createArray(this._data.duration);
        this._buffStacks = createArray(this._data.buffStacks);
        this._atk = this._data.atk || 0;
        this._atkType = ATTACK_TYPES[this._data.atkType] || ATTACK_TYPES.MAGIC;
        this._element = ELEMENTS[this._data.element] || ELEMENTS.NONE;
        this._aoe = this._data.aoe || 0;
        this._cd = this._data.cd || 0;
        this._targetType = TARGET_TYPES[this._data.target];
    },

    getId: function () {
        return this._id;
    },

    getName: function () {
        return this._name;
    },

    getDesc: function () {
        return this._description;
    },

    getType: function () {
        return this._type;
    },

    isHidden: function () {
        return this._hidden;
    },

    getBuffId: function () {
        return this._buffId;
    },

    getValue: function () {
        return this._value;
    },

    getDuration: function () {
        return this._duration;
    },

    getBuffStacks: function () {
        return this._buffStacks;
    },

    getAtk: function () {
        return this._atk;
    },

    getAtkType: function () {
        return this._atkType;
    },

    getElement: function () {
        return this._element;
    },

    getAoe: function () {
        return this._aoe;
    },

    getCd: function () {
        return this._cd;
    },

    getUsedCd: function () {
        return this._usedCd;
    },

    setUsedCd: function (cd) {
        this._usedCd = cd;
    },

    getTargetType: function () {
        return this._targetType;
    },
});

var Buff = cc.Class.extend({
    _initialValue: 0,
    _value: 0,
    _id: -1,
    _sourceSkill: null,
    _source: null,
    _target: null,
    _stacks: false,
    _timerLimit: 0,
    _timer: 0,
    ctor: function ($id, $value, $stacks, $sourceSkill, $source, $target) {
        this._sourceSkill = $sourceSkill;
        this._id = $id;
        this._value = $value;
        this._stacks = $stacks;
        this._target = $target;
        this._source = $source;
    },

    getId: function () {
        return this._id;
    },

    getSourceSkill: function () {
        return this._sourceSkill;
    },

    getSource: function () {
        return this._source;
    },

    getTarget: function () {
        return this._target;
    },

    stacks: function () {
        return this._stacks;
    },

    applyBuff: function () {
        switch (this._id) {
            case 1: // MS MOD (%)
                this._value = this._value * this._target.getMoveSpeed();
                this._target.setMoveSpeed(this._value);
                break;

            case 2: // STUN
                this._target.setStunned(true);
                var stunEffect = new Effect(1);
                stunEffect.setName("stun");
                stunEffect.setPosition(cc.p(0,25));
                this._target.addChild(stunEffect, 1);
                return stunEffect;

            case 3: // ARMOR MOD (VALUE)
                this._target.buffArmour(this._value);
                break;

            case 4: // DPS
                this._timerLimit = 1;
                this._timer = 1;
                break;

            case 5: // CLEAVE
                break;

            default:
                break;
        }
    },

    removeBuff: function () {
        switch (this._id) {
            case 1: // MS SLOW (%)
                this._target.setMoveSpeed(-1*this._value);
                break;

            case 2:
                this._target.setStunned(false);
                var stunEffect = this._target.getChildByName("stun");
                return stunEffect;

            case 3:
                this._target.buffArmour((-1) * this._value);
                break;

            default:
                break;
        }
    },
});

var TimedBuff = Buff.extend({
    _elapsed: 0,
    _duration: 0,
    ctor: function ($id, $value, $stacks, $sourceSkill, $source, $target, $duration) {
        this._super($id, $value, $stacks, $sourceSkill, $source, $target);
        this._duration = $duration
    },

    resetTimer: function () {
        this._elapsed = 0;
    },

    tick: function ($dt) {
        this._elapsed += $dt;
        this._timer += $dt;
        if (this._id === 4) {
            if (this._timer >= this._timerLimit) {
                this._target.damage(this._value);
                this._timer = 0;
            }
        }
        if (this._elapsed >= this._duration) return true;
        return false;
    },

});

var Effect = cc.Node.extend({
    _sprite: null,
    _frames: null,
    _frame: 0,
    _elapsed: 0,
    _totalTime: 0,
    _repeats: false,
    _repeatFrame: 0,
    ctor: function ($id) {
        this._super();
        this._frames = [];
        this._totalTime = global.effectList[$id].time;
        this._repeats = (global.effectList[$id].repeats === 1) ? true : false;
        this._repeatFrame = global.effectList[$id].repeatFrame;
        var x =  global.effectList[$id].framesX;
        var y = global.effectList[$id].framesY;
        var width =  global.effectList[$id].width;
        var height =  global.effectList[$id].height;
        var scale = global.effectList[$id].scale;
        for (var i = 0; i < y; i = (i + 1) | 0) {
            for (var j = 0; j < x; j = (j + 1) | 0) {
                this._frames.push(cc.rect(j*width, i*height, width, height));
            }
        }
        this._sprite = new cc.Sprite(res["effect"+zeroPadding($id,2)]);
        this._sprite.setScale(scale, scale);
        this.addChild(this._sprite, 1);
        if (x !== 0) {
            this._sprite.setTextureRect(this._frames[this._frame]);
        }
    },

    playAnimation: function ($dt) {
        this._elapsed += $dt;
        if (this._elapsed > this._totalTime / this._frames.length) {
            this._frame++;
            this._sprite.setTextureRect(this._frames[this._frame]);
            this._elapsed = 0;
            if (this._frame == this._frames.length-1) {
                if (this._repeats) {
                    this._frame = this._repeatFrame;
                } else {
                    return true;
                }
            }
            return false;
        }
    }
});

var Projectile = cc.Node.extend({
    _sprite: null,
    _speed: 0,
    _frames: null,
    _frame: 0,
    _repeatFrame: 0,
    _elapsed: 0,
    _source: null,
    _target: null,
    _totalTime: 0,
    _effectId: 0,
    ctor: function ($id, $source, $target) {
        this._super();
        this._source = $source;
        this._target = $target
        this._speed = global.projList[$id].speed;
        this._frames = [];
        this._totalTime = global.projList[$id].time;
        this._repeatFrame = global.projList[$id].repeatFrame;
        this._effectId = global.projList[$id].effectId;
        var x = global.projList[$id].framesX;
        var y = global.projList[$id].framesY;
        var width = global.projList[$id].width;
        var height = global.projList[$id].height;
        var scale = global.projList[$id].scale;
        for (var i = 0; i < y; i = (i + 1) | 0) {
            for (var j = 0; j < x; j = (j + 1) | 0) {
                this._frames.push(cc.rect(j*width, i*height, width, height));
            }
        }
        this._sprite = new cc.Sprite(res["proj"+zeroPadding($id,2)]);
        this._sprite.setScale(scale, scale);
        this.addChild(this._sprite, 1);
        if (x !== 0) {
            this._sprite.setTextureRect(this._frames[this._frame]);
        }
    },
    playAnimation: function ($dt) {
        if (this._totalTime != 0) {
            this._elapsed += $dt;
            if (this._elapsed > this._totalTime / this._frames.length) {
                this._frame++;
                if (this._frame > this._frames.length - 1) this._frame = this._repeatFrame;
                this._sprite.setTextureRect(this._frames[this._frame]);
                this._elapsed = 0;
            }
        }
    },

    getFlySpeed: function () {
        return this._speed;
    },

    getSource: function () {
        return this._source;
    },

    getTarget: function () {
        return this._target;
    },

    getEffectId: function () {
        return this._effectId;
    }
});