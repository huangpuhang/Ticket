function fomateDate(str) {
    var _date = new Date(str),
        year, month, date;
    year = _date.getFullYear();
    month = _date.getMonth() + 1;
    date = _date.getDate();
    str = year + '-' + month + '-' + date;
    return str;
}

exports.fomateDate = fomateDate;