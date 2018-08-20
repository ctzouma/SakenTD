var PlayerDataManager = cc.Class.extend({
    _player: null,
    ctor: function () {
        if (!this.loadData()) {
            this._player = new PlayerData();
            this.saveData();
        }
    },

    getInventory: function () {
        return this._player.inventory;
    },

    addToInventory: function ($id) {
        this._player.inventory.push($id);
    },

    getUnlockedStages: function () {
        return this._player.unlockedStages;
    },

    setUnlockedStages: function ($stages) {
        this._player.unlockedStages = $stages;
    },

    getCoins: function () {
        return this._player.shopCoins;
    },

    setCoins: function ($amount) {
        this._player.shopCoins = $amount;
    },

    saveData: function () {
        var data = {version: USER_DATA_VERSION, metadata: this._player};
        var saveData = JSON.stringify(data);
        cc.sys.localStorage.setItem("user_metadata", saveData);
    },

    loadData: function () {
        var loadData = cc.sys.localStorage.getItem("user_metadata");
        if (loadData === null || cc.isUndefined(loadData)) return false;
        var userData = JSON.parse(loadData);
        if (!cc.isNumber(userData.version) || userData.version !== USER_DATA_VERSION) {
            cc.sys.localStorage.removeItem("user_metadata");
            return false;
        }
        this._player = new PlayerData(userData.metadata);
        return true;
    }
});