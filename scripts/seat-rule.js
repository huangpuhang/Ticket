'use strict';

var _underscoreModified = require('./underscore.modified.js');

var _underscoreModified2 = _interopRequireDefault(_underscoreModified);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var TIPS = ['座位旁边不要留空', // 右
'座位旁边不要留空', // 左
'座位旁边不要留空', '座位旁边不要留空', '为避免留空，已关联取消了右侧座位', '为避免留空，已关联取消了左侧座位', '已选好最佳观影位置。'];

function checkSeatPolicy(target, context, xCoord, yCoord, room_seat) {
    var seats = room_seat;
    if (!seats[xCoord]) return;
    var row = seats[xCoord].columns;

    if (!row) return; // not a avail seat

    var current = row[yCoord];
    var currentInd = row.indexOf(current);
    console.log('seat index', currentInd);

    var left_1 = row[currentInd - 1];
    // left_1 = isSeat(left_1) && left_1;
    var left_2 = left_1 && row[currentInd - 2];
    var left_3 = left_2 && row[currentInd - 3];

    var right_1 = row[currentInd + 1];
    // right_1 = isSeat(right_1) && right_1;
    var right_2 = right_1 && row[currentInd + 2];
    var right_3 = right_2 && row[currentInd + 3];

    //   return isAvailable(current) ?
    //     onSelect(left_1, left_2, left_3, right_1, right_2, right_3, context) :
    //     (onUnselect(left_1, left_2, left_3, right_1, right_2, right_3, context) || true);
    return onSelect(left_1, left_2, left_3, right_1, right_2, right_3, context);
}

function onSelect(left_1, left_2, left_3, right_1, right_2, right_3, that) {
    // 9.16修改连选座位时，左1或右1可选座并且左2或右2为锁座并且在排的中间时不可选
    if (isChecked(left_1) && !right_2 || isChecked(right_1) && !left_2) {
        return true;
    }
    // 边缘座位
    if (!left_1 || !right_1) {
        // 左+1为边缘
        if (!left_1 && isAvailable(right_1) && isChecked(right_2)) {
            // 右+1为可选，右+2为（自已）已选，右+1连带选上
            console.log('左+1为边缘 ');
            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })

            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        }

        // 右+1为边缘
        if (!right_1 && isAvailable(left_1) && isChecked(left_2)) {
            // 左+1为可选，左+2为（自已）已选，左+1连带选上
            console.log('右+1为边缘');
            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        }
    }

    // 左+1或右+1为不可选

    // 左+1不可选
    if (!isAvailable(left_1)) {
        console.log('左+1不可选');
        if (isChecked(left_1) && (!right_2 || isUnavailable(right_2)) && isAvailable(right_1)) {
            // 左+1为已选座位并且（右+2是）
            // 9.17 修改连选座位时，修改连选3个座位后，在中间只有两个座位时第4个座位不能选
            // 10.12 修改中间座位只剩4个座位时可以从左或从右依次连选1、2、3和4个位；当中间座位只剩3个座位时，可以从左或从右依次连选1、2和3个位
            if (left_2 && left_3 && isAvailable(right_1)) {
                // 10.15 当在中间只剩3个座且左1为已卖，左2为可选，修改了从左往右选座到第2个座时选不了
                if (isUnavailable(left_2)) {
                    if (!(isUnavailable(left_2) && isUnavailable(right_2))) {
                        // wx.showModal({
                        //    content: TIPS[1],
                        //    showCancel: false,
                        // })
                        that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                        closeToast(that);
                        return 0;
                    }

                    return true;
                } else if (isAvailable(left_2)) {
                    //   wx.showModal({
                    //    content: TIPS[1],
                    //    showCancel: false,
                    // })
                    that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                    closeToast(that);
                    return 0;
                }

                return true;
            }
            // 10.15 当在中间只剩4个座且左1为已卖，左2为可选，修改了从左往右选座到第3个座时选不了
            if (isUnavailable(left_3)) {
                if (!(isUnavailable(left_3) && isUnavailable(right_2))) {
                    //   wx.showModal({
                    //    content: TIPS[1],
                    //    showCancel: false,
                    // })
                    that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                    closeToast(that);
                    return false;
                }

                return true;
            } else if (isAvailable(left_3)) {
                // wx.showModal({
                //    content: TIPS[1],
                //    showCancel: false,
                // })
                that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                closeToast(that);
                return false;
            }
        }
    } else if (isAvailable(right_1) && isChecked(right_2)) {

        // wx.showModal({
        //        content: TIPS[1],
        //        showCancel: false,
        //     })
        that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
        closeToast(that);
        return false;
    }

    // 右+1不可选
    if (!isAvailable(right_1)) {
        if (isChecked(right_1) && (!left_2 || isUnavailable(left_2)) && isAvailable(left_1)) {
            // 9.17 修改连选座位时，修改连选3个座位后，在中间只有两个座位时第4个座位不能选
            // 10.12 修改中间座位只剩4个座位时可以从左或从右依次连选1、2、3和4个位；当中间座位只剩3个座位时，可以从左或从右依次连选1、2和3个位
            if (!right_3 && isAvailable(left_1)) {
                // 10.15 当在中间只剩3个座且右1为已卖，右2为可选，修改了从右往左选座到第2个座时选不了
                if (isUnavailable(right_2)) {
                    if (!(isUnavailable(right_2) && isUnavailable(left_2))) {

                        //     wx.showModal({
                        //    content: TIPS[1],
                        //    showCancel: false,
                        // })
                        that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                        closeToast(that);
                        return false;
                    }

                    return true;
                } else if (isAvailable(right_2)) {

                    //   wx.showModal({
                    //    content: TIPS[1],
                    //    showCancel: false,
                    // })
                    that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                    closeToast(that);
                    return false;
                }

                // 10.15 当在中间只剩4个座且右1为已卖，右2为可选，修改了从右往左选座到第3个座时选不了
                if (isUnavailable(right_3)) {
                    if (!(isUnavailable(right_3) && isUnavailable(left_2))) {
                        //     wx.showModal({
                        //    content: TIPS[0],
                        //    showCancel: false,
                        // })
                        that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                        closeToast(that);
                        return false;
                    }

                    return true;
                } else if (isAvailable(right_3)) {
                    //   wx.showModal({
                    //    content: TIPS[0],
                    //    showCancel: false,
                    // })
                    that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
                    closeToast(that);
                    return false;
                }
            }
        } else if (isAvailable(left_1) && isChecked(left_2)) {
            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        }
    }

    // 左+1和右+1都可选
    if (isAvailable(left_1) && isAvailable(right_1)) {
        if (isAvailable(left_2) && isAvailable(right_2)) {

            return true;
        } else if (isChecked(left_2) && isChecked(right_2)) {

            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        } else if (isUnavailable(left_2)) {

            // 左+2为边缘或不是可选状态
            // toast.show({ message: isChecked(right_2) ? TIPS[0] : TIPS[1] });
            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        } else if (!right_2 || !isAvailable(right_2)) {
            // 右+2为边缘或不是可选状态
            // toast.show({ message: (isChecked(left_2) ? TIPS[0] : TIPS[1]) });
            //   wx.showModal({
            //        content: TIPS[4],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        } else {
            //   wx.showModal({
            //        content: TIPS[1],
            //        showCancel: false,
            //     })
            that.setData({ hintToast: { isShow: true, content: TIPS[1] } });
            closeToast(that);
            return false;
        }
    }

    return true;
}

function onUnselect(left_1, left_2, left_3, right_1, right_2, right_3, context) {
    var toggleSeat = context.toggleSeat;

    console.log('unselect');
    if ((!left_1 || !isAvailable(left_1)) && (!right_1 || !isAvailable(right_1))) {
        console.log('两边不为可选');
        // 两边不为可选
        if (isChecked(left_1) && isChecked(right_1)) {
            // 左边已选,右边已选
            console.log('左边已选,右边已选');
            if (isAvailable(right_2)) {
                // 右边+2为可选
                console.log('右边+2为可选');
                if (!right_3 || isAvailable(right_3)) {
                    // 右边+3有人或者为边缘
                    console.log('右边+3有人或者为边缘');
                    if (isChecked(right_1)) {
                        // 右+1为被（自己）选中状态，所带的这些属性都为真，连带取消

                        console.log('右+1为被（自己）选中状态，所带的这些属性都为真，连带取消');
                        wx.showModal({
                            content: TIPS[4],
                            showCancel: false
                        });

                        right_1 && toggleSeat(right_1.row, right_1.n);

                        return false;
                    }
                } else if (isChecked(left_2)) {
                    // 左+2为被（自己）选中状态
                    console.log('左+2为被（自己）选中状态');

                    if (isChecked(right_1)) {
                        // 右+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                        console.log('右+1为被（自己）选中状态，所带的这些属性都为真，连带取消');

                        wx.showModal({
                            content: TIPS[4],
                            showCancel: false
                        });
                        right_1 && toggleSeat(right_1.row, right_1.n);

                        return false;
                    }
                } else {
                    if (isUnavailable(left_2)) {
                        // 左2为不可选
                        console.log('左2为不可选');
                        if (isChecked(right_1)) {

                            // 右+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                            console.log('右+1为被（自己）选中状态，所带的这些属性都为真，连带取消');
                            wx.showModal({
                                content: TIPS[4],
                                showCancel: false
                            });
                            right_1 && right_1.isSeat && toggleSeat(right_1.row, right_1.n);

                            return false;
                        }
                    } else if (isUnavailable(right_2)) {
                        // 右2为不可选
                        console.log('右2为不可选');

                        if (isChecked(left_1)) {

                            // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                            console.log('左+1为被（自己）选中状态，所带的这些属性都为真，连带取消');

                            wx.showModal({
                                content: TIPS[4],
                                showCancel: false
                            });
                            left_1 && left_1.isSeat && toggleSeat(left_1.row, left_1.n);

                            return false;
                        }
                    } else if (isChecked(left_1)) {
                        // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                        console.log('左+1为被（自己）选中状态，所带的这些属性都为真，连带取消');
                        wx.showModal({
                            content: TIPS[4],
                            showCancel: false
                        });
                        left_1 && left_1.isSeat && toggleSeat(left_1.row, left_1.n);
                        return false;
                    }
                }
            } else {
                // 右边+2为不可选
                console.log('右边+2为不可选');
                if (isChecked(right_2)) {
                    // 右边+2选中时
                    console.log('右边+2选中时');
                    if (isChecked(left_1)) {
                        // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                        console.log('左+1为被（自己）选中状态，所带的这些属性都为真，连带取消');

                        wx.showModal({
                            content: TIPS[5],
                            showCancel: false
                        });
                        left_1 && left_1.isSeat && toggleSeat(left_1.row, left_1.n);
                        return false;
                    }
                } else if (isChecked(left_2)) {
                    // 左边+2选中时
                    console.log('左边+2选中时');
                    if (isChecked(right_1)) {
                        // 右+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                        console.log('右+1为被（自己）选中状态，所带的这些属性都为真，连带取消');
                        wx.showModal({
                            content: TIPS[4],
                            showCancel: false
                        });
                        right_1 && right_1.isSeat && toggleSeat(right_1.row, right_1.n);
                        return false;
                    }
                } else {
                    // 右边+2选中时
                    console.log('右边+2选中时');
                    if (isChecked(left_1)) {
                        // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                        console.log('左+1为被（自己）选中状态，所带的这些属性都为真，连带取消');
                        wx.showModal({
                            content: TIPS[5],
                            showCancel: false
                        });
                        left_1 && left_1.isSeat && toggleSeat(left_1.row, left_1.n);
                        return false;
                    }
                }
            }
        } else if (isChecked(left_1) && (!right_1 || !isAvailable(right_1) || !isChecked(right_1))) {
            console.log('左边已选,右边不可选或者为边缘');
            // 左边已选,右边不可选或者为边缘
            if (isUnavailable(left_2)) {
                return true;
            }
            if (isChecked(left_1)) {
                // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                wx.showModal({
                    content: TIPS[5],
                    showCancel: false
                });
                left_1 && left_1.isSeat && toggleSeat(left_1.row, left_1.n);
                return false;
            }
        } else if (isChecked(right_1) && (!left_1 || !isChecked(left_1) || !isAvailable(left_1_))) {
            // 右边已选,左边不可选或者为边缘
            console.log('右边已选,左边不可选或者为边缘');
            if (isUnavailable(right_2)) {
                return true;
            }
            if (isChecked(right_1)) {
                // 左+1为被（自己）选中状态，所带的这些属性都为真，连带取消
                wx.showModal({
                    content: TIPS[4],
                    showCancel: false
                });
                right_1 && right_1.isSeat && toggleSeat(right_1.row, right_1.n);
                return false;
            }
        } else {
            // console.log(`left_1: ${left_1.className}\n left_1_is_checked: ${isChecked(left_1)}`);
        }
    }

    return true;
}

function autoToast(that) {
    that.setData({ _hintToast: { isShow: true, content: TIPS[6] } });
    closeToast(that);
}

function closeToast(that) {
    setTimeout(function () {
        that.setData({
            hintToast: {
                isShow: false,
                content: ''
            },
            _hintToast: {
                isShow: false,
                content: ''
            }
        });
    }, 1500);
}

function isAvailable(seat) {
    return seat && seat.classStatus == 2;
}

function isChecked(seat) {
    return seat && seat.classStatus == 3;
}

function isUnavailable(seat) {
    return seat && seat.classStatus == 1;
}

function isSeat(seat) {
    return seat && seat.classStatus != 0;
}

/* [计算中线]
* @return { [type]} [description]
    * 目标是算出任意一个影院的坐位图的中线
    *
 * 比如如下坐位图，0 代表不可选的过道或者空座，x代表可选座位
*
 * 0xxxxxxx0 // 这排坐位最多
* x0000000x // 这排坐位最少，但是前后跨度最大，代表这排最长
* 000xxx000
    * 0x0xxx0x0 // 各种奇怪的过道出现*/
function _renderCenterLine(that, _room_seat) {
    // var that = SeatChooser;
    var seatInfo = _room_seat;
    var length = seatInfo.length;
    var rowWithMostSeatArr = [];
    var firstRow = 0;
    var lastRow = 0;
    var index = 0;
    // 由于会在每行前面增加不定数量的空座来实现居中
    // 需要算出可选座位跨度最大的那行来取中点
    // 把所有可选座位的index值组成一个数组
    // 然后使用数组的最后一个减去第一个的跨度取max
    try {
        _underscoreModified2.default.each(seatInfo, function (rowItem, i) {
            var seatsArr = [];
            _underscoreModified2.default.each(rowItem.columns, function (seat, j) {
                if(seat){
                    if (seat.st == 'LK' || seat.st == 'N') {
                        // 是座位
                        seatsArr.push(j);
                        if (index == 0) {
                            firstRow = i;
                        }
                        lastRow = i;
                        index++;
                    }
                }
            });
            var seatObject = {
                'available': seatsArr,
                'index': i
            };
            rowWithMostSeatArr.push(seatObject);
        });   
    } catch (error) {
        console.log('error',error);
    }
    // 拥有最多座位数的data
    // {
    //   index: 行数
    //   available: 所有可选座位的index
    // }
    var rowWithMostSeat = _underscoreModified2.default.max(rowWithMostSeatArr, function (rowWithMostSeatArr) {
        var firstOne = rowWithMostSeatArr.available[0];
        var lastOne = rowWithMostSeatArr.available[rowWithMostSeatArr.available.length - 1];
        return lastOne - firstOne;
    });

    // 拥有最长座位图的行数据
    var longestRow = seatInfo[rowWithMostSeat.index].columns;
    var longestSeatCount = longestRow.length;
    // longestRowEmpty 前面的空座位数目
    var longestRowEmpty = 0;
    // for (var idx = 0; idx < longestSeatCount; idx++) {
    //     longestRowEmpty += 1;
    //     if (longestRow[idx].type != 0 || longestRow[idx].type != 3 || longestRow[idx].type != 4 || longestRow[idx].type != 5 || longestRow[idx].type != 6) {
    //         break;
    //     }
    // }

    // 中间座位index = 总座位数的一半加上空座位数
    var firstSeat = rowWithMostSeat.available[0];
    var lastSeat = rowWithMostSeat.available[rowWithMostSeat.available.length - 1];
    // ( lastSeat - firstSeat + 1 )  从 0-5 实际是6个座位
    // Math.round 由于实现方式是在某一个坐位中增加元素来实现的中线
    // 所以在奇数情况先多偏移一个坐位，然后向左位移
    var centerIndex = Math.round((lastSeat - firstSeat + 1) / 2) + longestRowEmpty - 1;

    var centerRowNum = Math.ceil((lastRow - firstRow) / 2 + firstRow);
    seatInfo[centerRowNum].columns[centerIndex].position = '0-0';
    var hitSeats = _prepareBestSeats(that, seatInfo, centerRowNum, centerIndex);
    return {
        firstSeat: firstSeat,
        lastSeat: lastSeat,
        centerIndex: centerIndex,
        firstRow: firstRow,
        lastRow: lastRow,
        hitSeats: hitSeats
    };
}

/**
 * [_prepareBestSeats 准备可选座位]
 * @param  {[type]} centerRowNum [中心排排数]
 * @param  {[type]} centerIndex  [每排的中心坐标]
 * 计算方式：以中心点为圆心扩大，给周边*可选*座位增加 行坐标-位坐标
 *         1-1 代表距离中心点一行，偏移一个座位
 * 关联选择：命中的座位查找前后是否有可选座位，以上边的优先级判断
 * @return {[type]}              [description]
 */
function _prepareBestSeats(that, seatInfo, centerRowNum, centerIndex) {
    var _rows = seatInfo;
    var _allAvailableSeats = [];
    // 筛选可售座位并标记坐标
    try {
        _underscoreModified2.default.each(_rows, function (item, rowIndex) {
            var _absoluteRow = Math.abs(rowIndex - centerRowNum);
    
            _underscoreModified2.default.each(item.columns, function (seatitem, index) {
                var _absoluteIndex = Math.abs(index - centerIndex);
    
                // 不可选的不计入
                if (seatitem && seatitem.st != 'N') {
                    return;
                }
    
                // 已有position说明是中心座位，不重写position
                var _seat = _rows[rowIndex].columns[index];
                if (_seat) {
                    _seat.xcoord = rowIndex;
                    _seat.ycoord = index;
                    _seat.position = _absoluteRow + '-' + _absoluteIndex;
                }
    
                // 加入_allAvailableSeats
                _allAvailableSeats.push(_seat);
            });
        });   
    } catch (error) {
        console.log('error2',error);
    }

    var $hitSeat = null; // 当前命中的可选座位
    var $besideSeat = null; // 关联选择的第二个座位
    var $besideSeat2 = null; // 关联选择的第三个座位
    var $besideSeat3 = null; // 关联选择的第四个座位
    var selectedSeats = [];
    var firstSeat = null,
        secondSeats = null,
        thirdSeats = null,
        fourSeats = null;

    if (!_allAvailableSeats.length) {
        // 如果没有可选座位，隐藏帮我选座功能
        return null;
    } else if (_allAvailableSeats.length == 1) {
        // 如果只有一个作为可选，直接返回命中座位
        $hitSeat = _allAvailableSeats[0];
        // that.$hitSeat = $hitSeat;
        return null;
    }

    // 排序方式：中心点→右下→左下→右上→左上    
    // 
    // 是从前往后push的元素，所以需要反转
    _allAvailableSeats.reverse();

    // 排序
    // 行坐标 + 位坐标越小说明离中心点越近
    _allAvailableSeats.sort(function (a, b) {
        var _seatsPostionA = a.position.split('-');
        var _absolutePostionA = 0;
        _underscoreModified2.default.each(_seatsPostionA, function (item) {
            _absolutePostionA += parseInt(item);
        });

        var _seatsPostionB = b.position.split('-');
        var _absolutePostionB = 0;
        _underscoreModified2.default.each(_seatsPostionB, function (item) {
            _absolutePostionB += parseInt(item);
        });

        return _absolutePostionA - _absolutePostionB;
    });
    var len = _allAvailableSeats.length;
    for (var i = 0; i < len; i++) {
        var $seatItem = _allAvailableSeats[i];
        var xCoord = $seatItem.xcoord;
        var $prev = _rows[xCoord].columns[$seatItem.ycoord - 1];
        var $prev1 = _rows[xCoord].columns[$seatItem.ycoord - 2];
        var $prev2 = _rows[xCoord].columns[$seatItem.ycoord - 3];
        var isPrevAvailable = $prev && $prev.classStatus == 2 ? true : false;
        var isPrevAvailable1 = $prev1 && $prev1.classStatus == 2 ? true : false;
        var isPrevAvailable2 = $prev2 && $prev2.classStatus == 2 ? true : false;

        var $next = _rows[xCoord].columns[$seatItem.ycoord + 1];
        var $next1 = _rows[xCoord].columns[$seatItem.ycoord + 2];
        var $next2 = _rows[xCoord].columns[$seatItem.ycoord + 3];
        var isNextAvailable = $next && $next.classStatus == 2 ? true : false;
        var isNextAvailable1 = $next1 && $next1.classStatus == 2 ? true : false;
        var isNextAvailable2 = $next2 && $next2.classStatus == 2 ? true : false;
        var status = '';
        var thirdSeatType = '';

        $hitSeat = $seatItem;
        var isSelectSeat = checkSeatPolicy($hitSeat, that, $hitSeat.xcoord, $hitSeat.ycoord, seatInfo);
        if (!isSelectSeat) {
            $hitSeat = null;
        }
        // 存入最佳1个座位
        if (!firstSeat) {
            firstSeat = $hitSeat;
        }
        // 当前后都可选时
        if ($hitSeat) {
            if ($prev && isPrevAvailable && $next && isNextAvailable) {
                var _prevNum = parseInt($prev.position.split('-')[1]);
                var _nextNum = parseInt($next.position.split('-')[1]);
                var _isPrevSelect = checkSeatPolicy($prev, that, $prev.xcoord, $prev.ycoord, seatInfo);
                var _isNextSelect = checkSeatPolicy($next, that, $next.xcoord, $next.ycoord, seatInfo);
                if (_isPrevSelect && _isNextSelect) {
                    $besideSeat = _prevNum >= _nextNum ? $next : $prev;
                    status = _prevNum >= _nextNum ? 'R' : 'L';
                } else if (_isPrevSelect) {
                    $besideSeat = $prev;
                    status = 'L';
                } else if (_isNextSelect) {
                    $besideSeat = $next;
                    status = 'R';
                }
            } else if ($prev && isPrevAvailable) {
                // 只有前边可选时
                $besideSeat = $prev;
                status = 'L';
            } else if ($next && isNextAvailable) {
                // 之后后边可选时
                $besideSeat = $next;
                status = 'R';
            }

            seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 3;
            if ($besideSeat && !checkSeatPolicy($besideSeat, that, $besideSeat.xcoord, $besideSeat.ycoord, seatInfo)) {
                $besideSeat = null;
            }
            seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 2;

            // 如果存在连续的两个座位，break
            if ($hitSeat && $besideSeat) {
                // 存入最佳两个座位
                if (!secondSeats) {
                    secondSeats = _underscoreModified2.default.sortBy([$hitSeat, $besideSeat], function (item) {
                        return item.xcoord + item.ycoord;
                    });
                }
                // break;
                if (status == 'R') {
                    if ($prev && isPrevAvailable) {
                        $besideSeat2 = $prev;
                    } else if ($next1 && isNextAvailable1) {
                        $besideSeat2 = $next1;
                        thirdSeatType = 'R';
                    }
                } else if (status == 'L') {
                    if ($next && isNextAvailable) {
                        $besideSeat2 = $next;
                    } else if ($prev1 && isPrevAvailable1) {
                        $besideSeat2 = $prev1;
                        thirdSeatType = 'L';
                    }
                }
                if ($besideSeat2) {
                    seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 3;
                    seatInfo[$besideSeat.xcoord].columns[$besideSeat.ycoord].classStatus = 3;
                    if ($besideSeat2 && !checkSeatPolicy($besideSeat2, that, $besideSeat2.xcoord, $besideSeat2.ycoord, seatInfo)) {
                        $besideSeat2 = null;
                    }
                    seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 2;
                    seatInfo[$besideSeat.xcoord].columns[$besideSeat.ycoord].classStatus = 2;
                } else {
                    selectedSeats = [$hitSeat, $besideSeat];
                    // break;
                }
            }
            // 如果存在连续的三个座位
            if ($hitSeat && $besideSeat && $besideSeat2) {
                // 存入最佳3个座位
                if (!thirdSeats) {
                    thirdSeats = _underscoreModified2.default.sortBy([$hitSeat, $besideSeat, $besideSeat2], function (item) {
                        return item.xcoord + item.ycoord;
                    });
                }
                switch (thirdSeatType) {
                    case '':
                        if (status == 'L' && $prev1 && isPrevAvailable1) {
                            $besideSeat3 = $prev1;
                        } else if (status == 'R' && $next1 && isNextAvailable1) {
                            $besideSeat3 = $next1;
                        }
                        break;
                    case 'R':
                        if ($next2 && isNextAvailable2) {
                            $besideSeat3 = $next2;
                        }
                        break;
                    case 'L':
                        if ($prev2 && isPrevAvailable2) {
                            $besideSeat3 = $prev2;
                        }
                        break;
                }
                if ($besideSeat3) {
                    seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 3;
                    seatInfo[$besideSeat.xcoord].columns[$besideSeat.ycoord].classStatus = 3;
                    seatInfo[$besideSeat2.xcoord].columns[$besideSeat2.ycoord].classStatus = 3;
                    if ($besideSeat3 && !checkSeatPolicy($besideSeat3, that, $besideSeat3.xcoord, $besideSeat3.ycoord, seatInfo)) {
                        $besideSeat3 = null;
                    }
                    seatInfo[$hitSeat.xcoord].columns[$hitSeat.ycoord].classStatus = 2;
                    seatInfo[$besideSeat.xcoord].columns[$besideSeat.ycoord].classStatus = 2;
                    seatInfo[$besideSeat2.xcoord].columns[$besideSeat2.ycoord].classStatus = 2;
                    break;
                }
            } else if (len - 1) {
                $hitSeat = selectedSeats[0];
                $besideSeat = selectedSeats[1];
                selectedSeats = [];
            }
        }
    }

    // 如果没有连续两个座位，则取出排序后的前两个离中心点最近的
    if ($hitSeat && !$besideSeat && !$besideSeat2 && !$besideSeat3) {
        $besideSeat = findSeatMethod(_allAvailableSeats, [$hitSeat]);
        $besideSeat2 = findSeatMethod(_allAvailableSeats, [$hitSeat, $besideSeat]);
        $besideSeat3 = findSeatMethod(_allAvailableSeats, [$hitSeat, $besideSeat, $besideSeat2]);
    } else if ($hitSeat && $besideSeat && !$besideSeat2 && !$besideSeat3) {
        $besideSeat2 = findSeatMethod(_allAvailableSeats, [$hitSeat, $besideSeat]);
        $besideSeat3 = findSeatMethod(_allAvailableSeats, [$hitSeat, $besideSeat, $besideSeat2]);
    } else if ($hitSeat && $besideSeat && $besideSeat2 && !$besideSeat3) {
        $besideSeat3 = findSeatMethod(_allAvailableSeats, [$hitSeat, $besideSeat, $besideSeat2]);
    }

    fourSeats = _underscoreModified2.default.sortBy([$hitSeat, $besideSeat, $besideSeat2, $besideSeat3], function (item) {
        return item.xcoord + item.ycoord;
    });
    return [firstSeat, secondSeats, thirdSeats, fourSeats];
}

function findSeatMethod(seats, selectedSeats) {
    var len = seats.length,
        selectedSeatsLen = selectedSeats.length;
    for (var i = 0; i < len; i++) {
        var isSeat = true;
        for (var j = 0; j < selectedSeatsLen; j++) {
            if (seats[i].desc == selectedSeats[j].desc && seats[i].n == selectedSeats[j].n) {
                isSeat = false;
            }
        }
        if (isSeat) {
            return seats[i];
        }
    }
}

module.exports = {
    check: checkSeatPolicy,
    renderCenterLine: _renderCenterLine,
    autoToast: autoToast
};