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

	Object.assign(data, { "$str6873295": "last-movie-cell", "$str43921856": "", "$str4385080": "2D", "$str66649985": "3D", "$str21684597": "2DIMAX", "$str98913056": "3DIMAX", "$str87903700": "评分：", "$str22246231": "想看：", "$str17683914": "分" });return new View({ style: {}, attr: {}, children: $filterNullChildren([data.data ? new View({ style: {}, attr: { "class": "movie-list" }, children: $filterNullChildren([].concat(_toConsumableArray((data.data.hotList || []).map(function (item, index) {
				return new View({ style: {}, attr: { "class": "movie-cell " + (index === data.data.hotList.length - 1 ? data.$str6873295 : data.$str43921856), "bindtap": data.onTapMovie.bind(data.null, index) }, children: $filterNullChildren([new View({ style: {}, attr: { "class": "movie-cell-column " }, children: $filterNullChildren([new Image({ style: {}, attr: { "class": "poster", "src": item.img }, children: $filterNullChildren([]) })]) }), new View({ style: {}, attr: { "class": "movie-cell-column movie-cell-column-desc" }, children: $filterNullChildren([new View({ style: {}, attr: { "class": "title" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "name", "content": item.movie_name }, children: $filterNullChildren([]) }), item.version === data.$str4385080 ? new Image({ style: {}, attr: { "class": "tag", "src": "./images/2D.png" }, children: $filterNullChildren([]) }) : null, item.version === data.$str66649985 ? new Image({ style: {}, attr: { "class": "tag", "src": "./images/3D.png" }, children: $filterNullChildren([]) }) : null, item.version === data.$str21684597 ? new Image({ style: {}, attr: { "class": "longtag", "src": "./images/2DIMAX.png" }, children: $filterNullChildren([]) }) : null, item.version === data.$str98913056 ? new Image({ style: {}, attr: { "class": "longtag", "src": "./images/3DIMAX.png" }, children: $filterNullChildren([]) }) : null]) }), new View({ style: {}, attr: { "class": "detail" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "gray", "content": item.hasReleased ? data.$str87903700 : data.$str22246231 }, children: $filterNullChildren([]) }), item.hasReleased && item.movie_score ? new Text({ style: {}, attr: { "class": "orange", "content": item.movie_score + data.$str17683914 }, children: $filterNullChildren([]) }) : !item.hasReleased ? new Text({ style: {}, attr: { "class": "orange", "content": item.movie_expect }, children: $filterNullChildren([]) }) : new Text({ style: {}, attr: { "class": "gray", "content": "暂无" }, children: $filterNullChildren([]) })]) }), new View({ style: {}, attr: { "class": "detail" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "gray", "content": "主演：" }, children: $filterNullChildren([]) })].concat(_toConsumableArray((item.movie_actors || []).map(function (actor, index) {
								return new View({ style: {}, attr: {}, children: $filterNullChildren([index > 0 ? new Text({ style: {}, attr: { "class": "border" }, children: $filterNullChildren([]) }) : null, new Text({ style: {}, attr: { "class": "value", "content": actor }, children: $filterNullChildren([]) })]) });
							})), [!item.movie_actors.length ? new Text({ style: {}, attr: { "class": "gray", "content": "\n          暂无\n        " }, children: $filterNullChildren([]) }) : null])) }), item.movie_price ? new View({ style: {}, attr: { "class": "movie-cell-price detail" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "value price", "content": item.movie_price + "元" }, children: $filterNullChildren([]) }), new Text({ style: {}, attr: { "class": "value", "content": "起" }, children: $filterNullChildren([]) })]) }) : null]) })]) });
			})), [new View({ style: {}, attr: { "class": "movie-count", "bindtap": data.onTapCount }, children: $filterNullChildren([new View({ style: {}, attr: {}, children: $filterNullChildren([new Text({ style: {}, attr: { "content": data.data.remain_count + "部影片热映中，点击查看" }, children: $filterNullChildren([]) })]) })]) })])) }) : new View({ style: {}, attr: { "class": "no-result-wrapper" }, children: $filterNullChildren([new Text({ style: {}, attr: { "class": "no-result", "content": "未查询到电影票的相关信息" }, children: $filterNullChildren([]) })]) })]) });
};