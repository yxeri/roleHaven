'use strict';

const data = {};

data.create = {
  first: {
    positionName: 'posOne',
    coordinates: {
      longitude: 5,
      latitude: 5,
    },
  },
  second: {
    positionName: 'posTwo',
    coordinates: {
      longitude: 10,
      latitude: 19,
    },
  },
};

data.update = {
  toUpdate: {
    positionName: 'posThree',
    coordinates: {
      longitude: 5,
      latitude: 5,
    },
  },
  updateWith: {
    coordinates: {
      longitude: 1,
      latitude: 1,
      accuracy: 50,
    },
  },
};

data.remove = {
  toRemove: {
    positionName: 'postFive',
    coordinates: {
      longitude: 5,
      latitude: 5,
    },
  },
  secondToRemove: {
    positionName: 'postSix',
    coordinates: {
      longitude: 5,
      latitude: 5,
    },
  },
};

export default data;
