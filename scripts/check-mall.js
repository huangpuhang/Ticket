var app = getApp();

function checkMallIdOnIndex(mallId, cb) {
    // mallId = 10739;
    if (mallId) {
        wx.setStorageSync('mallId', mallId);
        getCurrentMall(mallId, {}, function(malls) {
            wx.setStorageSync('city', {
                id: malls.currentMallCity,
                nm: malls.currentMallCityName
            });
            wx.setStorageSync('mallInfo', {
                name: malls.currentMallName,
                mallId: mallId
            });
            var mallInfo = {
                id: malls.currentMallCity,
                nm: malls.currentMallCityName,
                mallName: malls.currentMallName
            }
            cb(mallInfo);
        })
    } else {
        var mallInfo = wx.getStorageSync('mallInfo');
        if (mallInfo) {
            wx.setStorageSync('mallId', mallInfo.mallId);
        } else {
            wx.setStorageSync('mallId', 10739);
        }
    }
}

function checkMallId(mallId, _switch) {
    // mallId = 10654;
    if (_switch == 0) return;
    if (mallId) {
        var that = this;
        wx.getLocation({
            type: 'wgs84',
            success(location) {
                getCurrentMall(mallId, location, function(malls) {
                    if (mallId != malls.locationMallId) {
                        wx.showModal({
                            content: '当前是' + malls.currentMallName + '，是否切换到最近的' + malls.locationMallName + '？',
                            success: function(res) {
                                if (res.confirm) {
                                    wx.setStorage({
                                        key: 'mallId',
                                        data: malls.locationMallId
                                    });
                                    wx.setStorage({
                                        key: 'mallInfo',
                                        data: {
                                            name: malls.locationMallName,
                                            mallId: malls.locationMallId
                                        }
                                    });
                                } else {
                                    wx.setStorage({
                                        key: 'mallId',
                                        data: mallId
                                    })
                                }
                            }
                        })
                    }
                });
            },
            fail: function() {
                wx.setStorage({
                    key: 'mallId',
                    data: mallId
                })
            }
        })
    }
}

function getCurrentMall(mallId, location, cb) {
    var mallId = mallId,
        malls = {},
        latitude = location.latitude || 1000,
        longitude = location.longitude || 1000;
    app.request().get('/city/currentMall').query({
        mallId: mallId,
        latitude: latitude,
        longitude: longitude
    }).end().then(function(res) {
        malls = res.body;
        cb(malls);
    })
}

exports.checkMallIdOnIndex = checkMallIdOnIndex;
exports.checkMallId = checkMallId;