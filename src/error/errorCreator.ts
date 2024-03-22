import AlreadyExists from './AlreadyExists.js';
import Banned from './Banned.js';
import Database from './Database.js';
import DoesNotExist from './DoesNotExist.js';
import Expired from './Expired.js';
import External from './External.js';
import GeneralError, { ErrorTypes } from './GeneralError.js';
import Incorrect from './Incorrect.js';
import Insufficient from './Insufficient.js';
import Internal from './Internal.js';
import InvalidCharacters from './InvalidCharacters.js';
import InvalidData from './InvalidData.js';
import InvalidLength from './InvalidLength.js';
import InvalidMail from './InvalidMail.js';
import NeedsVerification from './NeedsVerification.js';
import NotAllowed from './NotAllowed.js';
import TooFrequent from './TooFrequent.js';

export default {
  InvalidData,
  TooFrequent,
  InvalidMail,
  Expired,
  Internal,
  Insufficient,
  Banned,
  NeedsVerification,
  Incorrect,
  DoesNotExist,
  External,
  AlreadyExists,
  Database,
  InvalidLength,
  InvalidCharacters,
  NotAllowed,
  ErrorTypes: ErrorTypes,
  General: GeneralError,
};
