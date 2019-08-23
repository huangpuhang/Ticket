"use strict";

Object.defineProperty(exports, "__esModule", {
	value: true
});

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

var $filterNullChildren = function $filterNullChildren(children) {
	return children.filter(function (child) {
		return child != null;
	});
};

exports.default = function (data, opt) {
	var View = opt.View,
	    Text = opt.Text,
	    Image = opt.Image,
	    Navigator = opt.Navigator,
	    Location = opt.Location,
	    LineChart = opt.LineChart;

	Object.assign(data, { "$str12765103": "last-cell", "$str71017736": "" });return new View({ style: {}, attr: {}, children: $filterNullChildren([data.data ? new View({ style: {}, attr: { "class": "cinema-cell" }, children: $filterNullChildren([new View({ style: {}, attr: { "class": "cinema-info" }, children: $filterNullChildren([new Image({ style: {}, attr: { "class": "poster", "src": data.data.img }, children: $filterNullChildren([]) }), new View({ style: {}, attr: { "class": "cinema-detail" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "name", "content": data.data.cinema_name }, children: $filterNullChildren([]) }), new View({ style: {}, attr: { "class": "detail-item" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "detail-key", "content": "地址：" }, children: $filterNullChildren([]) }), new Text({ style: {}, attr: { "class": "detail-value address", "content": data.data.cinema_address }, children: $filterNullChildren([]) })]) }), new View({ style: {}, attr: { "class": "detail-item" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "detail-key", "content": "电话：" }, children: $filterNullChildren([]) }), new Text({ style: {}, attr: { "class": "detail-value", "content": data.data.cinema_telephone }, children: $filterNullChildren([]) })]) }), new View({ style: {}, attr: { "class": "detail-item" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "detail-key", "content": "价格：" }, children: $filterNullChildren([]) }), new Text({ style: {}, attr: { "class": "detail-value", "content": data.data.cinema_price + "元起" }, children: $filterNullChildren([]) })]) })]) })]) }), new View({ style: {}, attr: { "class": "movie-list" }, children: $filterNullChildren([].concat(_toConsumableArray((data.data.cinema_movie_list || []).map(function (item, index) {
					return new View({ style: {}, attr: { "class": "movie-cell" }, children: $filterNullChildren([new View({ style: {}, attr: { "class": "movie-deal " + (index === data.data.cinema_movie_list.length - 1 ? data.$str12765103 : data.$str71017736) }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "movie-nm", "content": item.movie_name }, children: $filterNullChildren([]) }), new View({ style: {}, attr: { "class": "movie-price" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "price-num", "content": item.movie_price }, children: $filterNullChildren([]) }), new Text({ style: {}, attr: { "class": "price-suffix", "content": "元起" }, children: $filterNullChildren([]) })]) })]) })]) });
				})))) })]) }) : new View({ style: {}, attr: { "class": "no-result-wrapper" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "no-result", "content": "未查询到" + data.query + "的相关信息" }, children: $filterNullChildren([]) })]) })]) });
};