'use strict';

const data = {};

data.create = {
  first: {
    amount: 1,
  },
  second: {
    amount: 1,
    note: 'transTwo',
  },
  missing: {
    amount: 1,
  },
};

data.update = {
  toUpdate: {
    note: 'new note',
    amount: 1,
  },
  updateWith: {
    note: 'transThree',
  },
};

data.remove = {
  toRemove: {
    amount: 1,
  },
  secondToRemove: {
    amount: 1,
  },
};

export default data;
