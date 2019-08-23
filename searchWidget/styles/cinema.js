'use strict';

module.exports = {
  'cinema-cell': {
    flexDirection: 'column',
    flexGrow: 1,
    justifyContent: 'space-between'
  },

  poster: {
    backgroundColor: '#eeeeee',
    width: 110,
    height: 110,
    flexShrink: 0,
    marginLeft: 2,
    marginTop: 2
  },

  'cinema-detail': {
    flexDirection: 'column',
    marginLeft: 12
  },

  name: {
    fontSize: 17,
    color: '#353535',
    lineHeight: 24,
    marginTop: 4,
    marginBottom: 11,
    textOverflow: 'ellipsis'
  },

  'detail-item': {
    fontSize: 14,
    color: '#333333',
    lineHeight: 22,
    marginTop: 2,
    alignItems: 'center'
  },

  'detail-key': {
    color: '#888888'
  },

  'detail-value': {
    color: '#333333'
  },

  address: {
    textOverflow: 'ellipsis'
  },

  'movie-list': {
    flexDirection: 'column'
  },

  dash: {
    width: 390,
    height: 1
  },

  'movie-cell': {
    flexDirection: 'column'
  },

  'movie-deal': {
    paddingTop: 13,
    paddingBottom: 16,
    fontSize: 14,
    lineHeight: 16,
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderColor: 'rgba(229, 229, 229, 0.5)',
    borderStyle: 'dashed',
    alignItems: 'center'
  },

  'last-cell': {
    paddingBottom: 0
  },

  'movie-nm': {
    color: '#333333'
  },

  'movie-price': {
    marginRight: 2
  },

  'price-num': {
    color: '#fa5151',
    marginRight: 3
  },

  'price-suffix': {
    color: '#888888'
  },

  'no-result-wrapper': {
    flexGrow: 1,
    justifyContent: 'center'
  },

  'no-result': {
    fontSize: 16,
    color: '#888888',
    textAlign: 'center',
    alignSelf: 'center'
  }
};