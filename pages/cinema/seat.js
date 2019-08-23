'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

//public values
var app = getApp();

var Finger = require('../../vendors/finger.js');
var risk = require('../../scripts/risk.js');
var Date2 = app.require('scripts/date2.js');
var _ = app.require('scripts/underscore.modified');
var seatRule = app.require('scripts/seat-rule');
var checkMall = require('../../scripts/check-mall');
var PROD = true;

var seatData = {};
var recommendData = [];
var MAX_SELECTED = 4;
var Timer = null;
var ToastTimer = null;
var ThumbTimer = null;

//设备尺寸
var windowWidth = 0;
var windowHeight = 0;
var ratio = 0;

//需改签的座位数下限
var migrateSeatNum = 0;

//初始设置加载座位图loading为可显示
var PageToastStatus = setHideValue('loading_hidden', false);

var seatImgMap = {
    '可选': '/images/seat-normal.png',
    '不可选': '/images/seat-disabled.png',
    '已选': '/images/seat-selected.png',
    '情侣座': '/images/seat-lover.png'
};

function translateToRightPosition(left, top, scale) {
    //TODO 45之类的magic words要使用语义常量
    var seatWidth = seatData.section[0].cols * 45;
    var seatHeight = seatData.section[0].rows * 45;
    var content = getContainerInfo()['content'];
    var contentWidth = content.width;
    var contentHeight = content.height;
    var translateX, translateY;

    //左
    if (left <= seatWidth / 2 / scale) {
        // 上
        if (top <= seatHeight / 2 / scale) {
            // 边
            if (left <= contentWidth / 2 / scale) {
                translateX = seatWidth / 2 - contentWidth / 2 / scale;
                //顶角 20 20
                if (top <= contentHeight / 2 / scale) {
                    translateY = seatHeight / 2 - seatHeight / 2 / scale;
                } else {
                    //中 20 50
                    translateY = seatHeight / 2 - top - (seatHeight - contentHeight) / 2 / scale;
                }
            } else {
                //内
                translateX = seatWidth / 2 - left;
                //顶 80 20
                if (top >= contentHeight / 2 / scale) {
                    translateY = seatHeight / 2 - seatHeight / 2 / scale;
                } else {
                    //中
                    translateY = seatHeight / 2 - top - (seatHeight - contentHeight) / 2 / scale;
                }
            }
        } else {
            //下
            //边
            if (left <= contentWidth / 2 / scale) {
                translateX = seatWidth / 2 - contentWidth / 2 / scale;
                //底角
                if (seatHeight - top <= contentHeight / scale) {
                    translateY = contentHeight / scale - seatHeight / 2 / scale - seatHeight / 2;
                } else {
                    //中
                    translateY = (contentHeight / 2 - seatHeight / 2 + (seatHeight / 2 - top) * scale) / scale;
                }
            } else {
                //内
                translateX = seatWidth / 2 - left;
                //底
                if (seatHeight - top <= contentHeight / 2 / scale) {
                    translateY = contentHeight / scale - seatHeight / 2 / scale - seatHeight / 2;
                } else {
                    //中
                    translateY = (contentHeight / 2 - seatHeight / 2 + (seatHeight / 2 - top) * scale) / scale;
                }
            }
        }
    } else {
        // 右
        //上
        if (top <= seatHeight / 2 / scale) {
            //边
            if (seatWidth - left <= contentWidth / 2 / scale) {
                translateX = (contentWidth - seatWidth * scale) / 2 / scale;
                //顶角
                if (top <= contentHeight / 2 / scale) {
                    translateY = seatHeight / 2 - seatHeight / 2 / scale;
                } else {
                    //中
                    translateY = seatHeight / 2 - top - (seatHeight - contentHeight) / 2 / scale;
                }
            } else {
                translateX = seatWidth / 2 - left;
                //内
                //顶
                if (top <= contentHeight / 2 / scale) {
                    translateY = seatHeight / 2 - seatHeight / 2 / scale;
                } else {
                    //中
                    translateY = seatHeight / 2 - top - (seatHeight - contentHeight) / 2 / scale;
                }
            }
        } else {
            //下
            //边
            if (seatWidth - left <= contentWidth / 2 / scale) {
                translateX = (contentWidth - seatWidth * scale) / 2 / scale;
                //底角
                if (seatHeight - top <= contentHeight / 2 / scale) {
                    translateY = contentHeight / scale - seatHeight / 2 / scale - seatHeight / 2;
                } else {
                    //中
                    translateY = (contentHeight / 2 - seatHeight / 2 + (seatHeight / 2 - top) * scale) / scale;
                }
            } else {
                translateX = seatWidth / 2 - left;
                //内
                //底
                if (seatHeight - top <= contentHeight / 2 / scale) {
                    translateY = contentHeight / scale - seatHeight / 2 / scale - seatHeight / 2;
                } else {
                    //中
                    translateY = (contentHeight / 2 - seatHeight / 2 + (seatHeight / 2 - top) * scale) / scale;
                }
            }
        }
    }

    // 如果在最底部,加1排
    if (seatHeight - top < 80) {
        translateY -= 45;
    }
    // 最左边
    if (left === 0) {
        translateX += 45;
    }
    // 最右边
    if (seatWidth - left === 45) {
        translateX -= 45;
    }

    return {
        translateX: translateX,
        translateY: translateY
    };
}

function handleScale(context, scaleInfo, isNeedDruation) {

    if (isNeedDruation) {
        context.setData({ druation: '.5' });
    }

    //scaleThumb(context, scaleInfo.scaleTo);

    scaleInfo.scaleFrom = scaleInfo.scaleTo;
    context.setData({
        scaleFrom: scaleInfo.scaleTo,
        scaleInfo: scaleInfo
    });

    setTimeout(function () {
        context.setData({ druation: 0, scaleFrom: null });
    }, 500);

    hideThumb(context);
}

function scaleThumb(context, scale) {
    var seatWidth = context.data.seatWidth;
    var seatHeight = context.data.seatHeight;
    var contentWidth = context.data.content.width;
    var contentHeight = context.data.content.height;
    var translateX = context.data.translateX;
    var translateY = context.data.translateY;
    var thumbInitScale = context.data.thumbInitScale;

    var rectWidth = contentWidth * thumbInitScale / scale;
    var rectHeight = contentHeight * thumbInitScale / scale;

    if (rectWidth > seatWidth * thumbInitScale) {
        rectWidth = seatWidth * thumbInitScale;
        console.log(rectWidth);
    }

    if (rectHeight > seatHeight * thumbInitScale) {
        rectHeight = seatHeight * thumbInitScale;
        console.log(rectHeight);
    }

    var xRatio = contentWidth / seatWidth;
    var yRatio = contentHeight / seatHeight;

    var aliasX = context.data.aliasX;
    var aliasY = context.data.aliasY;

    aliasX = aliasX ? aliasX * xRatio : seatWidth / 2 * thumbInitScale - rectWidth / 2;
    aliasY = aliasY ? aliasY * yRatio : seatHeight / 2 * thumbInitScale - rectHeight / 2;

    drawRedRect(aliasX, aliasY, rectWidth, rectHeight);

    context.setData({
        aliasX: aliasX,
        aliasY: aliasY
    });
}

//隐藏缩略图
function hideThumb(context) {
    if (ThumbTimer) {
        clearTimeout(ThumbTimer);
    }

    ThumbTimer = setTimeout(function () {
        context.setData({ showThumb: false });
    }, 3000);
}

//绘制缩略图红框
function drawRedRect(x, y, width, height) {
    var context = wx.createContext();

    context.setStrokeStyle("#dd403b");
    context.setLineWidth(1);
    context.rect(x, y, width, height);
    context.stroke();

    wx.drawCanvas({
        canvasId: 'red-react',
        actions: context.getActions()
    });
}

function translateThumb(context) {
    var scaleInfo = context.data.scaleInfo;
    var thumbInitScale = context.data.thumbInitScale;

    var x = (context.data.aliasX + context.data.translateX) * thumbInitScale;
    var y = (context.data.aliasY + context.data.translateY) * thumbInitScale;

    var rectWidth = context.data.content.width * thumbInitScale / scaleInfo.scaleTo;
    var rectHeight = context.data.content.height * thumbInitScale / scaleInfo.scaleTo;

    drawRedRect(x, y, rectWidth, rectHeight);

    context.setData({
        aliasX: x,
        aliasY: y
    });
}

//选择座位
function selectSeat(seatNo) {
    var rowsData = seatData.section[0].seats;
    for (var i = 0, len = rowsData.length; i < len; i++) {
        var rowData = rowsData[i].columns;
        var rowId = rowsData[i].rowId;
        for (var j = 0; j < rowData.length; j++) {
            if (seatNo === rowData[j].seatNo) {
                //如果是情侣座，左边选中，右边自动选中。右边亦然。
                if (rowData[j].st === 'L') {
                    rowData[j + 1]['selected'] = !rowData[j]['selected'];
                    rowData[j + 1]['rowId'] = rowId;
                } else if (rowData[j].st === 'R') {
                    rowData[j - 1]['selected'] = !rowData[j]['selected'];
                    rowData[j - 1]['rowId'] = rowId;
                }
                rowData[j]['selected'] = !rowData[j]['selected'];
                rowData[j]['rowId'] = rowId;
                break;
            }
        }
    }

    seatData.section[0].seats = rowsData;
    return seatData;
}

function cancelSeat(seatNo) {
    var rowsData = seatData.section[0].seats;
    for (var i = 0, len = rowsData.length; i < len; i++) {
        var rowData = rowsData[i].columns;
        for (var j = 0; j < rowData.length; j++) {
            if (seatNo === rowData[j].seatNo) {
                //如果是情侣座，左边取消，右边自动取消。右边亦然。
                if (rowData[j].st === 'L') {
                    rowData[j + 1]['selected'] = false;
                } else if (rowData[j].st === 'R') {
                    rowData[j - 1]['selected'] = false;
                }
                rowData[j]['selected'] = false;
                break;
            }
        }
    }

    seatData.section[0].seats = rowsData;
    return seatData;
}

function getSelectedData(seatData) {
    var result = [];
    var rowsData = seatData.section[0].seats;

    for (var i = 0, len = rowsData.length; i < len; i++) {
        var rowData = rowsData[i].columns;
        for (var j = 0; j < rowData.length; j++) {
            if (rowData[j] && rowData[j].selected && result.length <= MAX_SELECTED) {
                result.push(rowData[j]);
            }
        }
    }

    return result;
}

//设置toast和弹窗变量
function setHideValue(key, value) {

    var pageToastStatus = {
        max_selected_hidden: true, //最大购票数提醒
        otherday_confirm_hidden: true, //是否当天场次提醒
        loading_hidden: true, //选座页初始化时的loading
        selectseat_error_hidden: true, //中间留空错误提示
        selectseat_error_hidden2: true, //旁边留空错误提示
        submitOrder_hidden: true, //提交订单loading
        submitOrder_fail_hidden: true, //订单失败
        goback_slectseats_hidden: true, //回退弹窗，暂时无法实现
        max_selected_num: MAX_SELECTED,
        scaleRatio: 2,
        migrateCount: migrateSeatNum
    };

    for (var i in pageToastStatus) {
        if (pageToastStatus.hasOwnProperty(i) && i === key) {
            pageToastStatus[key] = value;
            break;
        }
    }

    return pageToastStatus;
}

//  判断座位是否符合选座规则, true符合， false不符合
function checkSeat(currentSeatNo, allseats) {
    //TODO
    var result = {
        sideFlag: true,
        middleFlag: true
    };

    //  检查旁边或中间是否有空座 XOX OXO OXXO OXXXO
    result = checkSideIsEmpty(currentSeatNo, allseats, 'left', result);
    result = checkSideIsEmpty(currentSeatNo, allseats, 'right', result);

    return result;
}

//  XOX OXO OXXO OXXXO 不符合规则
//  规则wiki：http://wiki.sankuai.com/pages/viewpage.action?pageId=58233677
function checkSideIsEmpty(currentSeatNo, allseats, direction, result) {
    //  st状态说明：N:普通坐，LK：不可定座位，L：情侣座左边 R：情侣座右边  E：空座位
    var otherDirection = direction == 'left' ? 'right' : 'left';
    result = result || {
        sideFlag: true,
        middleFlag: true
    };

    var directionSeat = getNextSeat(currentSeatNo, allseats, direction);
    if (directionSeat && directionSeat.st === "N" && !directionSeat.selected) {
        var directionNextSeat = getNextSeat(directionSeat.seatNo, allseats, direction);
        if (directionNextSeat && directionNextSeat.selected) {
            if (result['middleFlag']) {
                result['middleFlag'] = false;
            }
            return result;
        }
        if (!directionNextSeat || directionNextSeat.st === 'LK' || directionNextSeat.st === 'E') {
            var otherDirectionSeat = getNextSeat(currentSeatNo, allseats, otherDirection);
            while (otherDirectionSeat && otherDirectionSeat.st !== 'LK' && otherDirectionSeat.st !== 'E') {
                if (!otherDirectionSeat.selected) {
                    if (result['sideFlag']) {
                        result['sideFlag'] = false;
                    }
                    return result;
                    break;
                }
                otherDirectionSeat = getNextSeat(otherDirectionSeat.seatNo, allseats, otherDirection);
            }
        }
    }

    return result;
}

//获取指定方向的next seat
function getNextSeat(currentSeatNo, allseats, direction) {
    //TODO
    var result = null;

    for (var i = 0, len = allseats.length; i < len; i++) {
        var row = allseats[i].columns;
        for (var j = 0; j < row.length; j++) {
            if (direction === 'left') {
                if (row[j].seatNo === currentSeatNo && row[j - 1]) {
                    result = row[j - 1];
                    break;
                }
            } else {
                if (row[j].seatNo === currentSeatNo && row[j + 1]) {
                    result = row[j + 1];
                    break;
                }
            }
        }

        if (result) {
            break;
        }
    }

    return result;
}

//拼装最终选择的座位
function getSelectedSeats(selectedData) {
    var checkedSeats = {};
    checkedSeats['count'] = selectedData.length;
    checkedSeats['list'] = [];

    //"rowId":"4","columnId":"8","st":"N","seatNo":"433"
    for (var i = 0; i < selectedData.length; i++) {
        var seatObj = {};
        seatObj['rowId'] = selectedData[i].rowId;
        seatObj['columnId'] = selectedData[i].columnId;
        seatObj['st'] = selectedData[i].st;
        seatObj['seatNo'] = selectedData[i].seatNo;

        checkedSeats['list'].push(seatObj);
    }

    return checkedSeats;
}

function getContainerInfo(selectedData) {
    var containerInfo = {};
    var headerInitHeight = 16; //vh
    var footerInitHeight_norcmnosld = 9; //vh footer初始化高度（无推荐座位无已选座位）（数据待测）
    var footerInitHeight_hasrcmorsld = 20; //vh footer初始化高度（无推荐座位无已选座位）
    var footerInitHeight_tall = 26.25; //vh 已选座位或可推荐座位超过四个高度 （数据待测）
    var footerInitHeight = footerInitHeight_norcmnosld;
    var allHeight = 100;

    //如果有推荐座位
    if (recommendData && recommendData.length > 0) {
        footerInitHeight = footerInitHeight_hasrcmorsld; //vh
    }

    var contentHeight = allHeight - footerInitHeight - headerInitHeight;
    var footerHeight = footerInitHeight;

    //如果选的座位超过4个即一行，则修改footer高度
    if (selectedData && selectedData.length > 0) {
        if (selectedData.length > 4) {
            contentHeight = allHeight - footerInitHeight_tall - headerInitHeight;
            footerHeight = footerInitHeight_tall;
        } else {
            contentHeight = allHeight - footerInitHeight_hasrcmorsld - headerInitHeight;
            footerHeight = footerInitHeight_hasrcmorsld;
        }
    }

    containerInfo['content'] = {
        displayHeight: contentHeight,
        height: contentHeight * windowHeight / 100,
        width: windowWidth
    };

    containerInfo['footer'] = {
        displayHeight: footerHeight,
        height: footerHeight * windowHeight / 100,
        width: windowWidth
    };

    return containerInfo;
}

//更新选座购买区域view
function updateBuyBlock(app, selectedData) {
    var containerInfo = getContainerInfo(selectedData);
    /*containerInfo['content'].width /= ratio;
    containerInfo['content'].height /= ratio;*/
    app.setData(containerInfo);
    app.setData({
        isShowRecommend: !(selectedData.length > 0)
    });
}

//获取座位图的缩放比例
function getScaleInfo() {
    var containerInfo = getContainerInfo();
    var contentWidth = containerInfo.content.width;
    var contentHeight = containerInfo.content.height;

    //座位区域的长宽
    var seatWidth = seatData.section[0].cols * 45;
    var seatHeight = seatData.section[0].rows * 45;

    var scaleW = contentWidth / seatWidth;
    var scaleH = contentHeight / seatHeight;

    //能显示全部内容的缩放比例
    var scaleFit = Math.min(scaleH, scaleW);

    //能铺满屏幕的缩放比例
    var scaleFill = Math.max(scaleH, scaleW);

    //用户可操作的最小缩放比例
    var scaleMin = 18 / 35;

    var scaleFrom = 0,
        scaleTo = 0;

    //如果座位很少，可以显示所有座位，则从最小比例放大到最大比例
    if (seatWidth < contentWidth && seatHeight < contentHeight) {
        scaleFrom = scaleMin;
        scaleTo = 1;
        //座位很多，最小比例放不下，这时需要从能放大的比例变到最小比例
    } else if (scaleFit < scaleMin) {
        scaleFrom = scaleFit;
        scaleTo = scaleMin;
    }
    //中间情况，此时从最小放大至恰好能显示全部内容的比例
    else {
            scaleFrom = scaleMin;
            scaleTo = scaleFit;
        }

    scaleFrom = Math.min(scaleFrom, scaleTo * 0.6);

    return {
        scaleFrom: scaleFrom,
        scaleTo: scaleTo,
        scaleMin: scaleMin,
        scaleMax: 1,
        scaleFit: scaleFit,
        scaleFill: scaleFill
    };
}

function expoOut(pos) {
    return -Math.pow(1, -2 * pos) + 1;
}

function getTranslateObj(info) {
    //重新获取容器的尺寸
    var containerInfo = info.containerInfo || getContainerInfo();
    var content = containerInfo['content'];

    var seatHeight = seatData.section[0].rows * 45;

    //**厅 height:18 银幕中央 height:16
    var containerH = seatHeight;
    var displayH = content.height;
    //var translateY = ( - containerH + displayH ) / (2 * info.scaleTo); // 座位图中点对其显示区域中点
    var translateY = -(containerH * (1 - info.scaleTo)) / (2 * info.scaleTo) + displayH / (10 * info.scaleTo); // 座位图顶点离显示区域顶点高度为固定值： 1／10 * 显示区域高度

    return {
        translateX: 0,
        translateY: translateY
    };
}

app.MoviePage({
    data: {
        // 影院信息
        seatData: {},

        //已选择座位数据
        selectedData: [],

        //页面各种toast的状态
        pageToastData: PageToastStatus,

        //座位图放大倍数
        scaleInfo: { scaleTo: 1 },

        //checkseats
        checkedseats: JSON.stringify({ count: 0, list: [] }),

        //滚动处理
        rowNumberPosition: 'absolute',

        scrollLeft: 0,
        translateX: 0,
        translateY: 0,

        content: {
            displayHeight: 75
        },
        footer: {
            displayHeight: 9
        },
        seatImgMap: seatImgMap,
        tel: '',
        isActive: true,
        activeRemainNum: 2,
        originPrice: 200,
        activePrice: 100
    },
    refreshCurrentPrice: function () {
        var isActive = this.data.isActive,
            activeRemainNum = this.data.activeRemainNum,
            originPrice = this.data.originPrice,
            activePrice = this.data.activePrice,
            selectedData = this.data.selectedData;
        if (isActive && selectedData.length > 0) {
            selectedData.map(function (item) {
                item.currentPrice = activePrice
            })
            if (selectedData.length > activeRemainNum) {
                wx.showToast({
                    title: '您已享受过优惠，后续单价以原价展示',
                    icon: 'none'
                });
                selectedData.slice(activeRemainNum).map(function (item) {
                    item.currentPrice = originPrice;
                })
            }
        } else {
            selectedData.map(function (item) {
                item.currentPrice = originPrice
            })
        }
        this.setData({ selectedData: selectedData });
    },
    findSelectedSeats: function findSelectedSeats(selectedSeats) {
        if (!selectedSeats.length) return;

        var seats = seatData.section[0].seats;
        var selected = selectedSeats.split('|');

        seats.forEach(function (row) {
            return row.columns.forEach(function (seat) {
                selected.forEach(function (seatNum) {
                    if (row.rowId + ':' + seat.columnId === seatNum) {
                        seat.selected = true;
                        seat.st = "N";
                        seat.rowId = row.rowId;
                    }
                });
            });
        });

        var selectedData = getSelectedData(seatData);
        var selectedLength = selectedData.length;

        //更新购买区尺寸
        updateBuyBlock(this, selectedData);

        var checkedSeats = getSelectedSeats(selectedData);

        //update data
        this.setData({
            totalMoney: selectedLength > 0 ? seatData.seatsPrice[selectedLength]['price'].replace("元", "") : '',
            expression: selectedLength > 0 ? seatData.seatsPrice[selectedData.length]['expression'] : '',
            section: seatData.section,
            selectedData: selectedData,
            checkedSeats: JSON.stringify(checkedSeats)
        });
    },


    editTel: function editTel(e) {
        this.setData({
            telDialog: {
                isShowTelDialog: true,
                isInput: true,
                isFocus: true
            }
        });
    },
    closeTelDialog: function closeTelDialog(e) {
        var that = this;
        this.setData({
            telDialog: {
                isShowTelDialog: true,
                isTelDialogErr: false,
                isInput: false,
                isFocus: false
            }
        });
        setTimeout(function () {
            that.setData({
                telDialog: {
                    isShowTelDialog: false,
                    isTelDialogErr: false,
                    isInput: false,
                    isFocus: false
                }
            });
        }, 500);
    },
    bind_input: function bind_input(e) {
        this.inputTel = e.detail.value;
    },
    seavPhone: function seavPhone() {
        var oldPhone = this.data.tel;
        var phone = this.inputTel ? this.inputTel : oldPhone;
        var validate = phone != "" && oldPhone != "" && phone == oldPhone;
        if (validate) {
            this.closeTelDialog();
            return;
        }

        if (phone && phone.length == 11) {
            this.setData({
                tel: phone
            });
            wx.setStorage({
                key: "orderTel",
                data: phone
            });
            this.closeTelDialog();
        } else {
            this.setData({
                telDialog: {
                    isShowTelDialog: true,
                    isTelDialogErr: true,
                    isInput: true
                }
            });
        }
    },

    //选座处理
    handleSelect: function handleSelect(e) {
        console.log("select e:", e);
        var target = e.currentTarget;
        var self = this;
        console.log(target.dataset.no);
        
        //已选择的座位信息
        var checkedSeats = {};

        var newSeatData = selectSeat(target.dataset.no);
        var selectedData = getSelectedData(newSeatData);
        console.log(selectedData);

        var scaleTo = self.data.scaleInfo.scaleTo;
        var scaleInfo = getScaleInfo();

        //选座时放大倍数为最大放大倍数
        scaleInfo['scaleTo'] = scaleInfo['scaleMax'];

        var seatWidth = seatData.section[0].cols * 45;
        var seatHeight = seatData.section[0].rows * 45;
        var content = getContainerInfo()['content'];
        var contentWidth = content.width;
        var contentHeight = content.height;
        var top = target.offsetTop;
        var left = target.offsetLeft;
        var scale = scaleInfo.scaleTo;
        var translateInfo = {};

        if (scaleInfo.scaleTo !== scaleTo) {
            translateInfo = translateToRightPosition(left, top, scale);
        }

        console.log("selectSeat scale:", scaleInfo);

        // fix 6plus大屏手机的问题
        if (ratio >= 2.5) {
            scaleInfo['scaleTo'] = scaleTo;
        }

        console.log("handle select scale:", scaleInfo);

        handleScale(self, scaleInfo, true);

        var selectedLength = selectedData.length;
        if (selectedLength > MAX_SELECTED) {
            //从已选择座位中删掉当前的选择
            newSeatData = selectSeat(target.dataset.no);
            selectedData = getSelectedData(newSeatData);
            this.setData({
                pageToastData: setHideValue('max_selected_hidden', false)
            });

            if (ToastTimer) {
                clearTimeout(ToastTimer);
            }

            ToastTimer = setTimeout(function () {
                self.setData({
                    pageToastData: setHideValue('max_selected_hidden', true)
                });
            }, 1000);
            return false;
        }

        //更新购买区尺寸
        updateBuyBlock(this, selectedData);

        checkedSeats = getSelectedSeats(selectedData);

        //update data
        this.setData({
            totalMoney: selectedLength > 0 ? seatData.seatsPrice[selectedLength]['price'].replace("元", "") : '',
            expression: selectedLength > 0 ? seatData.seatsPrice[selectedData.length]['expression'] : '',
            translateX: isNaN(translateInfo.translateX) ? self.data.translateX : translateInfo.translateX,
            translateY: isNaN(translateInfo.translateY) ? self.data.translateY : translateInfo.translateY,
            section: newSeatData.section,
            selectedData: selectedData,
            checkedSeats: JSON.stringify(checkedSeats)
        });
        // this.refreshCurrentPrice();
    },
    //选择推荐座位
    handleRecommend: function handleRecommend(e) {
        //TODO
        var target = e.currentTarget;
        var seatsInfo = JSON.parse(target.dataset.seats);
        var remindText = target.dataset.remind;
        var newSeatData;

        for (var i = 0; i < seatsInfo.length; i++) {
            newSeatData = selectSeat(seatsInfo[i].seatNo);
        }
        var selectedData = getSelectedData(newSeatData);
        var checkedSeats = getSelectedSeats(selectedData);
        
        updateBuyBlock(this, selectedData);

        this.toast(remindText, 1500);

        var scaleInfo = this.data.scaleInfo;
        scaleInfo['scaleTo'] = Math.min(scaleInfo['scaleMin'], scaleInfo['scaleFrom']);

        /* 针对推荐座位在最后一排情况的处理
        var middle = Math.round(seatsInfo.length / 2);
        var left = seatsInfo[middle].columnId * 45;
        var top = seatsInfo[middle].rowNum * 45;
        var translateInfo = translateToRightPosition(left, top, scaleInfo.scaleTo);*/

        var translateObj = getTranslateObj({
            scaleTo: scaleInfo.scaleTo
        });

        this.setData(_extends({
            isShowRecommend: false,
            section: newSeatData.section,
            selectedData: selectedData,
            totalMoney: seatData.seatsPrice[selectedData.length]['price'].replace("元", ""),
            expression: seatData.seatsPrice[selectedData.length]['expression'],
            checkedSeats: JSON.stringify(checkedSeats)
        }, translateObj) //缩放后推荐座位移动到正确的位置
        );

        handleScale(this, scaleInfo, true);
        // this.refreshCurrentPrice();
    },
    //取消已选择座位
    handleCancelSeat: function handleCancelSeat(e) {
        //TODO
        var target = e.currentTarget;
        var newSeatData = cancelSeat(target.dataset.no);
        var selectedData = getSelectedData(newSeatData);
        var checkedSeats = getSelectedSeats(selectedData);

        updateBuyBlock(this, selectedData);

        this.setData({
            section: newSeatData.section,
            selectedData: selectedData,
            totalMoney: selectedData.length > 0 ? seatData.seatsPrice[selectedData.length]['price'].replace("元", "") : '',
            expression: selectedData.length > 0 ? seatData.seatsPrice[selectedData.length]['expression'] : '',
            checkedSeats: JSON.stringify(checkedSeats)
        });

        // this.refreshCurrentPrice();
    },
    onSubmitOrder: function onSubmitOrder(e) {
        // app.checkLogin({
        //     warn: '确认选座前请先登录',
        //     success: () => {
        //         this.submitOrder(e)
        //     },
        // })
        this.submitOrder(e);
    },

    //提交选座信息，创建订单
    submitOrder: function submitOrder(e) {
        var _this = this;

        //TODO
        var target = e.target;
        var checkedSeats = target.dataset.seats;
        var seqNo = target.dataset.seqno;
        var sectionid = target.dataset.sectionid;
        var sectionname = target.dataset.sectionname;
        var self = this;

        if (!checkedSeats) {
            return;
        }

        // 选座合法性检查
        var checkSeatsInfo = JSON.parse(checkedSeats);
        var hasSelectedSeats = checkSeatsInfo.list;
        var hasSelectedSeatsNum = hasSelectedSeats.length;
        var orderSeats = this.data.seatData.hallName;
        var _selectSeatText = '';
        var selectSeats = [];
        var tel = this.data.tel;
        if (tel == '') {
            wx.showToast({
                title: '请填写手机号码',
                icon: 'none',
                duration: 1000
            });
            return;
        }
        for (var i = 0; i < hasSelectedSeatsNum; i++) {
            var isValidSeat = checkSeat(hasSelectedSeats[i].seatNo, seatData.section[0].seats);

            if (!isValidSeat.middleFlag) {
                console.log("中间留有空位");
                this.setData({
                    pageToastData: setHideValue('selectseat_error_hidden', false)
                });

                setTimeout(function () {
                    self.setData({
                        pageToastData: setHideValue('selectseat_error_hidden', true)
                    });
                }, 1000);

                return false;
            }

            if (!isValidSeat.sideFlag) {
                console.log("旁边留有空位");
                this.setData({
                    pageToastData: setHideValue('selectseat_error_hidden2', false)
                });

                setTimeout(function () {
                    self.setData({
                        pageToastData: setHideValue('selectseat_error_hidden2', true)
                    });
                }, 1000);

                return false;
            }
            selectSeats.push(hasSelectedSeats[i].seatNo);
            if (i == hasSelectedSeatsNum - 1) {
                _selectSeatText += hasSelectedSeats[i].rowId + '\u6392' + hasSelectedSeats[i].columnId + '\u5EA7';
            } else {
                _selectSeatText += hasSelectedSeats[i].rowId + '\u6392' + hasSelectedSeats[i].columnId + '\u5EA7,';
            }
        }
        orderSeats += ' ' + _selectSeatText;
        this.seatLocklLoading(true);

        app.request().post('/seat/lock').query({
            'mobile': tel,
            'cinema_no': this.movieId,
            'movie_no': this.cinemaId,
            'schedule_id': this.scheduleId,
            'seat_lable': selectSeats.join()
        }).header({
            'mallcoo-mall-id': wx.getStorageSync('mallId')
        }).end().then(function (res) {
            _this.seatLocklLoading(false);
            if (res.body.code == 0) {
                var _res$body$data = res.body.data,
                    ticketOrderId = _res$body$data.ticketOrderId,
                    fee = _res$body$data.fee,
                    payNum = _res$body$data.payNum,
                    seatLable = _res$body$data.seatLable,
                    totalFee = _res$body$data.totalFee,
                    unitPrice = _res$body$data.unitPrice;

                app.$ticketOrderId = ticketOrderId;
                var urlObj = { url: '../order/buy?orderId=' + ticketOrderId + '&fee=' + fee + '&payNum=' + payNum + '&seatLable=' + seatLable + '&totalFee=' + totalFee + '&unitPrice=' + unitPrice + '&orderSeatsText=' + orderSeats + '&seatsLen=' + selectSeats.length };
                app.goto(urlObj.url);
            } else {
                _this.toast('\u9501\u5EA7\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
                app.$ticketOrderId = null;
            }
            // console.log(this.selectSeat)
        }).catch(function (err) {
            _this.seatLocklLoading(false);
            _this.toast('\u9501\u5EA7\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5');
            app.$ticketOrderId = null;
        });

        return;
    },
    formSubmit: function formSubmit(e) {
        //暂时注释掉
        // if (e.detail.formId) {
        //    app.sendMessage({
        //        template_id: 'ZfBzzxZglGXrozh7erVXJ-OixRmDM6UiHkMGO76hFEI',
        //        data: {"keyword1": "339208499", "keyword2": "12", "keyword3": "2016年"},
        //        form_id: e.detail.formId
        //    })
        // }
    },
    maxSelectedChange: function maxSelectedChange(e) {
        //TODO
        this.setData({
            pageToastData: setHideValue('max_selected_hidden', true)
        });
    },
    loadingChange: function loadingChange(e) {
        this.setData({
            pageToastData: setHideValue('loading_hidden', true)
        });
    },
    confirmDesc: function confirmDesc() {
        var seatData = this.data.seatData;

        this.setData({
            pageToastData: setHideValue('otherday_confirm_hidden', true)
        });
        if (seatData.roomSeat.length == 0) {
            wx.navigateBack({
                delta: 1
            });
        }
    },
    confirmSelect: function confirmSelect() {
        this.setData({
            pageToastData: setHideValue('otherday_confirm_hidden', true)
        });
    },
    onLoad: function onLoad(options) {
        this.options = options;
        checkMall.checkMallId(options.mallId);
        this.movieId = +options.movieId;
        this.cinemaId = +options.cinemaId;
        this.scheduleId = +options.scheduleId;
        this.cinemaName = options.cinemaName;
        this.unitPrice = options.price;
        this.showTime = options.showTime;
        var self = this;
        var flag = true;
        var scaleTo = 1;
        var pinchScaleInfo = null;
        var lastAnimationTS = 0;
        var timespan = 50;
        var tel = wx.getStorageSync('orderTel');
        if (tel) {
            this.setData({
                tel: tel
            });
        }
        // var flag = 1
        risk.params(); // 预调用, 提高获取参数的速度

        this.finger = new Finger({
            multipointStart: function multipointStart(e) {
                scaleTo = Number(self.data.scaleInfo.scaleTo);
            },
            pinch: function pinch(e) {
                // console.log('pinch loading success!', e);

                if (Date.now() - lastAnimationTS < timespan) {
                    return;
                }

                //显示缩略图
                if (!self.data.showThumb) {
                    self.setData({ showThumb: true });
                }

                var scaleInfo = getScaleInfo();
                // console.log("pinch scaleInfo", scaleInfo);

                scaleInfo['scaleTo'] = scaleTo * e.scale;
                pinchScaleInfo = scaleInfo;
                handleScale(self, scaleInfo);
                lastAnimationTS = Date.now();

                //e.preventDefault();
            },
            pressMove: function pressMove(e) {
                // console.log("pressMove:", e);
                var content = getContainerInfo()['content'];
                // TODO maxX 与 maxY 跟 hanldeScale里计算的最上,最下,最左,最右一致
                // var maxX = Math.ceil(content.width / 2)
                // var maxY = contentHeight / scale - seatHeight / 2 / scale - seatHeight / 2;

                var translateY = self.data.translateY + e.deltaY;
                var translateX = self.data.translateX + e.deltaX;

                // if (Math.abs(translateX) >= maxX) {
                //     translateX = translateX > 0 ? expoOut(translateX - maxX) + maxX : expoOut(translateX + maxX) - maxX;
                // }
                // if (Math.abs(translateY) >= maxY) {
                //     translateY = translateY > 0 ? expoOut(translateX - maxY) + maxY : expoOut(translateY + maxY) - maxY;
                // }

                this.timeStamp = e.timeStamp;

                self.setData({
                    showThumb: true,
                    translateY: translateY,
                    translateX: translateX
                });

                //translateThumb(self);

                hideThumb(self);

                // e.preventDefault();
            },
            touchStart: function touchStart(e) {},
            touchEnd: function touchEnd(e) {
                if (pinchScaleInfo) {
                    // 补间放缩会初始的动画
                    var scaleInfo = getScaleInfo();

                    if (pinchScaleInfo['scaleTo'] > scaleInfo['scaleMax']) {
                        scaleInfo['scaleTo'] = scaleInfo['scaleMax'];
                    } else if (pinchScaleInfo['scaleTo'] < scaleInfo['scaleMin']) {
                        scaleInfo['scaleTo'] = scaleInfo['scaleMin'];
                    } else {
                        scaleInfo['scaleTo'] = pinchScaleInfo['scaleTo'];
                    }

                    pinchScaleInfo = null;
                    handleScale(self, scaleInfo);
                }
            }
        });

        //获取系统设备信息
        wx.getSystemInfo({
            success: function success(res) {
                windowWidth = res.windowWidth;
                windowHeight = res.windowHeight;
                ratio = res.pixelRatio;

                self.setData({
                    ratio: ratio,
                    druation: 0,
                    scaleFrom: '0.1'
                });
            },
            fail: function fail(res) {
                console.log(res);
            },
            complete: function complete(res) {
                //TODO
            }
        });

        // this.checkUserUnPayOrder();
        
        // })
        // .catch(err => {
        //     if (err.res && err.res.data.error) {
        //         self.setData({
        //             pageToastData : setHideValue('loading_hidden', true)
        //         });

        //         self.toast(err.res.data.error.message, 3000)
        //         self.backTimer = setTimeout(() => {
        //             wx.navigateBack()
        //         }, 3000)
        //         return
        //     }
        // })

        if (!!options.sourceOrderId) {
            //是否是改签

            migrateSeatNum = options.seatCount;

            this.setData({
                migrate: {
                    migrateTarget: true,
                    sourceOrderId: options.sourceOrderId,
                    source: options.source
                }
            });
        } else {
            migrateSeatNum = 0;
        }
    },
    checkUserUnPayOrder: function () {
        var that = this;
        wx.showLoading({ title: '获取座位图...' });
        app.request().get('/order/getUserUnPayOrderInfo').end().then(function (res) {
            var data = res.body.data;
            that.unPayOrderId = data.unPayOrderId;

            if (data.hasUnPayOrder) {
                var pageToastData = setHideValue('loading_hidden', true);
                that.setData({ pageToastData: pageToastData });
                wx.showModal({
                    content: '当前有未支付订单，是否去支付？',
                    success: function (res) {
                        if (res.confirm) {
                            app.goto('../order/buy?orderId=' + data.unPayOrderId);
                        } else {
                            that.cancleOrder();
                        }
                    }
                })
            } else {
                that.getSeatList();
            }
        })
    },
    getSeatList: function getSeatList() {
        var _this2 = this;

        var self = this;
        app.request().get('/seat/list').query({
            'schedule_id': this.scheduleId
        }).end().then(function (res) {
            var _seatData = res.body.data;
            wx.hideLoading();
            if (_seatData && _seatData.roomSeat.length > 0) {
                _this2.selectSeat = _.find(_seatData.roomSeat, function (item) {
                    return item.status == 'Available';
                });

                var section = [],
                    seats = [];
                _seatData.roomSeat.map(function (item) {
                    var xcoord = item.ycoord - 1,
                        ycoord = item.xcoord - 1;

                    if (!seats[xcoord]) {
                        seats[xcoord] = {};
                    }
                    if(item.rowNum){
                        seats[xcoord].rowId = item.rowNum;
                        seats[xcoord].rowNum = item.rowNum;
                    }
                    seats[xcoord].columns = [];
                    seats[xcoord].isSeat = false;
                    _seatData.roomSeat.map(function (_item) {
                        var _xcoord = _item.ycoord - 1,
                            _ycoord = _item.xcoord - 1;
                        if (seats[_xcoord] && seats[xcoord].columns) {
                            seats[_xcoord].columns[_ycoord] = {
                                columnId: _item.colNum,
                                seatNo: _item.seatID,
                                st: _item.status == 'None' ? 'E' : _item.status == 'Available' ? 'N' : 'LK'
                            };
                        }
                    });
                });
                _seatData.section = [];
                _seatData.section[0] = {
                    cols: seats[0].columns.length,
                    rows: seats.length,
                    seats: seats
                };
                _seatData.showDate = _seatData.showtime;
                _seatData.showTime = _this2.showTime;
                _seatData.cinemaName = _this2.cinemaName;
                _seatData.unitPrice = _this2.unitPrice;
                _seatData.lang = _seatData.movieLanguage;
                _seatData.tp = _seatData.movieVersion;
                _seatData.showDateText = new Date2(_seatData.showDate).toString('E M月d日');

                var bestSeats = seatRule.renderCenterLine(_this2, seats);

                if (bestSeats.hitSeats) {

                    var bestRecommendation = {
                        bestOne: {
                            "seatDesc": {
                                "img": "http://p0.meituan.net/movie/e01b7b9d694e93ecbc7ead28b92d94395702298.png",
                                "remind": "这是目前观影最佳位置哦！"
                            },
                            "seats": [bestSeats.hitSeats[0]]
                        },
                        bestTwo: {
                            "seatDesc": {
                                "img": "http://p0.meituan.net/movie/e01b7b9d694e93ecbc7ead28b92d94395702298.png",
                                "remind": "这是目前观影最佳位置哦！"
                            },
                            "seats": bestSeats.hitSeats[1]
                        },
                        bestThree: {
                            "seatDesc": {
                                "img": "http://p0.meituan.net/movie/e01b7b9d694e93ecbc7ead28b92d94395702298.png",
                                "remind": "这是目前观影最佳位置哦！"
                            },
                            "seats": bestSeats.hitSeats[2]
                        },
                        bestFour: {
                            "seatDesc": {
                                "img": "http://p0.meituan.net/movie/e01b7b9d694e93ecbc7ead28b92d94395702298.png",
                                "remind": "这是目前观影最佳位置哦！"
                            },
                            "seats": bestSeats.hitSeats[3]
                        }
                    };

                    _seatData.bestRecommendation = bestRecommendation;
                }
                _seatData.buyNumLimit = 4;
                try {
                    seatMethod(_seatData);
                } catch (error) {
                    console.log('error3',error);
                }

                wx.setNavigationBarTitle({
                    title: _seatData.movieName
                });
            } else {
                //   this.toast('')
                _seatData.desc = '无可售座位，请更换场次';
                var pageToastData = setHideValue('loading_hidden', true);
                pageToastData = setHideValue('otherday_confirm_hidden', !_seatData.desc);
                _this2.setData({
                    seatData: _seatData,
                    pageToastData: pageToastData
                });
            }
            // console.log(_this2.selectSeat);
        }).catch(function (err) {
            console.log('errrrrrrrrrrr',err);
        });
        function seatMethod(_seatData) {

            var _data = { "data": { "bestRecommendation": { "bestFive": { "seatDesc": { "remind": "大家都爱的好位置哦！" }, "seats": [] }, "bestFour": { "seatDesc": { "remind": "大家都爱的好位置哦！" } }, "bestOne": { "seatDesc": { "remind": "大家都爱的好位置哦！" }, "seats": [{ "columnId": "08", "rowId": "4", "rowNum": 4, "sectionId": "0000000000000001" }] }, "bestSix": { "seatDesc": { "remind": "大家都爱的好位置哦！" } }, "bestThree": { "seatDesc": { "remind": "大家都爱的好位置哦！" } }, "bestTwo": { "seatDesc": { "remind": "大家都爱的好位置哦！" } } }, "buyNumLimit": 6, "cinemaId": 8186, "cinemaName": "首都电影院(悦荟万科广场店)", "desc": "", "fansMeeting": "", "glassInfo": "", "hallId": "0000000000000002", "hallName": "2号厅", "isShowRecommendation": 1, "lang": "国语", "langWarn": 0, "movieId": 341516, "movieName": "狄仁杰之四大天王", "originPrice": "0", "preLimit": 0, "preTag": "", "price": "0", "remind": "", "seatTypeList": [{ "icon": "http://p1.meituan.net/movie/9dfff6fd525a7119d44e5734ab0e9fb41244.png", "name": "可选" }, { "icon": "http://p1.meituan.net/movie/bdb0531259ae1188b9398520f9692cbd1249.png", "name": "不可选" }, { "icon": "http://p0.meituan.net/movie/585588bd86828ed54eed828dcb89bfdd1401.png", "name": "已选" }], "seatsPrice": { "1": { "expression": "49X1", "price": "49" }, "2": { "expression": "49X2", "price": "98" }, "3": { "expression": "49X3", "price": "147" }, "4": { "expression": "49X4", "price": "196" }, "5": { "expression": "49X5", "price": "245" }, "6": { "expression": "49X6", "price": "294" } }, "section": [], "selectSeatImages": [], "selectedImages": [], "selectedSeatTypes": "", "selectedSeats": "", "selectedSectionId": "", "sellStatus": 1, "seqNo": "201808020064817", "showDate": "2018-08-02", "showId": 64817, "showTime": "14:00", "soldImages": [], "tp": "3D" } };
            seatData = _data.data;
            seatData = _extends({}, seatData, _seatData);
            //场次已过期，请选座其他场次
            /*if (!seatData.showInfo) {
                return;
            }*/

            //处理推荐座位的数据，添加seatNo
            recommendData = [];
            for (var key in seatData.bestRecommendation) {
                //TODO
                if (seatData.bestRecommendation.hasOwnProperty(key) && seatData.bestRecommendation[key]) {
                    recommendData.push(seatData.bestRecommendation[key]);
                }
            }

            //对recommendData进行处理添加seatNo
            for (var i = 0; i < recommendData.length; i++) {
                var recommendSeats = recommendData[i].seats;
                for (var j = 0, len = recommendSeats.length; j < len; j++) {
                    if (recommendSeats[j].rowId && recommendSeats[j].columnId) {
                        var rowId = recommendSeats[j].rowNum;
                        var columnId = recommendSeats[j].columnId;

                        var rowData = seatData.section[0].seats[rowId - 1];
                        var seat,
                            index = 0;
                        while (index < rowData.columns.length && (!rowData.columns[index].columnId || rowData.columns[index].columnId !== columnId)) {
                            index++;
                        }

                        seat = rowData.columns[index];
                        recommendSeats[j].seatNo = seat.seatNo;
                        recommendSeats[j] = recommendSeats[j];
                    }
                }

                recommendData[i].seats = JSON.stringify(recommendSeats);
                recommendData[i].count = recommendSeats.length;
            }

            MAX_SELECTED = seatData.buyNumLimit ? seatData.buyNumLimit : 4;
            var recommendNum = Math.min(MAX_SELECTED, 4);
            //按照推荐座位的个数生序排序
            recommendData = recommendData.sort(function (a, b) {
                var result;
                if (a.count > b.count) {
                    result = 1;
                } else if (a.count === b.count) {
                    result = 0;
                } else {
                    result = -1;
                }

                return result;
            }).slice(0, recommendNum);

            recommendData = recommendData.filter(function (item) {
                return item.count > 0;
            });

            var rows = seatData.section[0].rows,
                columns = seatData.section[0].cols;

            // 显示loading以及非今日影讯提示
            var pageToastData = setHideValue('loading_hidden', true);
            pageToastData = setHideValue('otherday_confirm_hidden', !seatData.desc);

            var scaleInfo = getScaleInfo();
            // console.log("request scaleInfo:", scaleInfo);

            //重新获取容器的尺寸
            var containerInfo = getContainerInfo();
            var content = containerInfo['content'];
            var footer = containerInfo['footer'];

            //计算middleLine的位置
            var middleLinePosition;
            if (columns % 2 === 0) {
                //TODO
                middleLinePosition = columns / 2 * 45 - 5;
            } else {
                middleLinePosition = (columns + 1) / 2 * 45 - 5;
            }

            var seatWidth = seatData.section[0].cols * 45;
            var seatHeight = seatData.section[0].rows * 45;

            var translateObj = getTranslateObj({
                containerInfo: containerInfo,
                scaleTo: scaleInfo.scaleTo
            });

            seatData.showDateText = new Date2(seatData.showDate).toString('E M月d日');

            self.setData(_extends({
                footer: footer,
                content: content,
                section: seatData.section,
                seatData: seatData,
                recommendSeats: recommendData,
                isShowRecommend: recommendData.length > 0,
                selectedData: getSelectedData(seatData),
                pageToastData: pageToastData,
                middleLinePosition: middleLinePosition,
                hallHeight: 18 * scaleInfo.scaleTo,
                seatWidth: seatWidth,
                seatHeight: seatHeight,
                thumbInitScale: Math.max(260 / seatWidth, 159 / seatHeight) * 0.5, //缩略图背景宽260px,高159px,计算出比例后，再缩放至一半
                showThumb: true
            }, translateObj));

            self.findSelectedSeats(seatData.selectedSeats);

            // wx.setNavigationBarTitle({
            //     title: seatData.movieName
            // });

            //处理初始化缩放
            handleScale(self, scaleInfo, true);
        }
    },

    onReady: function onReady() {
        // 页面渲染完成
    },
    onShow: function onShow() {
        this.checkUserUnPayOrder();
        // var _this3 = this;
        // if (app.$ticketOrderId) {
        //     _this3.cancleOrder();
        //     return;
        //     wx.showModal({
        //         content: '有未支付订单，是否去支付?',
        //         success: function (res) {
        //             if (res.confirm) {
        //                 app.goto('../order/buy?orderId=' + app.$ticketOrderId);
        //             } else {
        //                 _this3.cancleOrder();
        //             }
        //         }
        //     })
        // }
    },
    cancleOrder: function(){
        var that = this;
        var pageToastData = setHideValue('loading_hidden', false);
        that.setData({pageToastData:pageToastData});
        wx.showLoading({ title: '获取座位图...' });
        app.request().post('/order/cancle').query({
            ticketOrderId: that.unPayOrderId
        }).end().then(function (res) {
            that.getSeatList();
            app.$ticketOrderId = null;
            // app.$ticketOrderId = null
        }).catch(function (err) {
            // app.$ticketOrderId = null
        });
    },
    onHide: function onHide() {
        // 页面隐藏
        clearTimeout(this.backTimer);
    },
    onUnload: function onUnload() {
        // 页面关闭
        // 隐藏所有弹窗
        PageToastStatus = {
            max_selected_hidden: true, //最大购票数提醒
            otherday_confirm_hidden: true, //是否当天场次提醒
            loading_hidden: true, //选座页初始化时的loading
            selectseat_error_hidden: true, //中间留空错误提示
            selectseat_error_hidden2: true, //旁边留空错误提示
            submitOrder_hidden: true, //提交订单loading
            submitOrder_fail_hidden: true, //订单失败
            goback_slectseats_hidden: true //如果已经选择座位，点击返回后的提示
        };

        this.setData({
            pageToastData: PageToastStatus
        });

        clearTimeout(this.backTimer);
    },
    touchstart: function touchstart(e) {
        // console.log('touchstart', e)
        this.finger.start(e);
    },
    touchmove: function touchmove(e) {
        this.finger.move(e);
    },
    touchend: function touchend(e) {
        // console.log('touchend', e)
        this.finger.end(e);
    },
    touchcancel: function touchcancel(e) {
        console.log('touchCancel', e);
        this.finger.cancel(e);
    },
    onShareAppMessage: function onShareAppMessage() {
        // var date = this.options.showDate.split('-');
        var showTime = this.data.seatData.showTime;
        var _mallId = wx.getStorageSync('mallId');
        return {
            title: this.cinemaName,
            path: 'pages/cinema/seat?' + app.shareParams(_extends({}, this.options, { mallId:_mallId }))
        };
    }
});