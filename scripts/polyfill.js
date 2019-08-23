"use strict";

/* eslint no-extend-native: "off" */
String.prototype.includes = String.prototype.includes || function (str) {
  return this.indexOf(str) !== -1;
};

Array.prototype.includes = Array.prototype.includes || function (item) {
  return this.indexOf(item) !== -1;
};