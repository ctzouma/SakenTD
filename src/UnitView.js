var UnitView = cc.Node.extend({
    unitData: null,

    ctor: function () {
        this._super();
    },

    onEnter: function () {
        this._super();
        this.scheduleUpdate();
    },

    onExit: function () {
        this.unscheduleUpdate();
        this._super();
    },

    setData: function ($data) {
        this.unitData = $data;
    },

    update: function (dt) {
        this._super(dt);
    },
});