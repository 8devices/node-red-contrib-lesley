'use strict';

const TYPE_OBJECT = 0;
const TYPE_MULTIPLE_RESOURCE = 1;
const TYPE_RESOURCE_INSTANCE = 2;
const TYPE_RESOURCE = 3;

const binToInt = function binaryToInteger(binaryData) {
  return parseInt(binaryData.toString('hex'), 16);
};

const binToBitStr = function binaryToBitString(binaryData) {
  return binToInt(binaryData).toString(2);
};

const Instance = class LwM2MInstance {
  constructor(payload) {
    let binaryData = payload;
    const identifierAndLength = this.readType(binaryData);
    binaryData = binaryData.slice(1);
    this.identifier = binToInt(binaryData.slice(0, identifierAndLength[0]));
    binaryData = binaryData.slice(identifierAndLength[0]);
    this.readLength(binaryData, identifierAndLength[1]);
    binaryData = binaryData.slice(identifierAndLength[1]);
    this.leftoverData = this.readValue(binaryData).slice(this.valueLength);
  }

  readType(binaryData) {
    let typeByte = (binToBitStr(binaryData.slice(0, 1))).split('');
    typeByte = Array(8 - typeByte.length).fill('0').concat(typeByte);
    this.type = parseInt(typeByte[0] + typeByte[1], 2);
    const identifierLength = parseInt(typeByte[2], 2) + 1;
    const lengthType = parseInt((typeByte[3] + typeByte[4]), 2);
    const valueLength = parseInt((typeByte[5] + typeByte[6] + typeByte[7]), 2);
    if (lengthType === 0) {
      this.valueLength = valueLength;
    }
    return [identifierLength, lengthType];
  }

  readIdentifier(binaryData, identifierLength) {
    this.identifier = binToInt(binaryData.slice(0, identifierLength));
  }

  readLength(binaryData, lengthType) {
    if (lengthType !== 0) {
      this.valueLength = binToInt(binaryData.slice(0, lengthType));
    }
  }

  readValue(binaryData) {
    switch (this.type) {
      case TYPE_OBJECT: {
        this.valueObject = new Instance(binaryData.slice(0, this.valueLength));
        break;
      }
      case TYPE_MULTIPLE_RESOURCE: {
        // TODO: Add multiple resource instance support (Type 1 and 2)
        // this contains one of multiple resource values
        break;
      }
      case TYPE_RESOURCE_INSTANCE: {
        // TODO: Add multiple resource instance support (Type 1 and 2)
        // this contains multiple resources
        break;
      }
      case TYPE_RESOURCE: {
        this.binaryValue = binaryData.slice(0, this.valueLength);
        break;
      }
      default: {
        this.binaryValue = null;
      }
    }
    return binaryData.slice(this.valueLength);
  }

  getType() {
    return this.type;
  }

  getIdentifier() {
    return this.identifier;
  }

  getValue() {
    return this.value;
  }

  getResource(resourceId) {
  // TODO: Change resources inside objects to list, like in parseTLV method
    if ((this.valueObject.getType() === 3) &&
        (this.valueObject.getIdentifier() === resourceId)) {
      return this.valueObject;
    } else if ((this.getType() === 3) &&
        (this.getIdentifier() === resourceId)) {
      return this;
    }
    return null;
  }

  getBinaryValue() {
    return binToBitStr(this.binaryValue);
  }

  getBooleanValue() {
    return this.getBinaryValue() !== '0';
  }

  getUnsignedIntegerValue() {
    switch (this.valueLength) {
      case 0:
        return 0;
      case 1:
        return this.binaryValue.readUInt8();
      case 2:
        return this.binaryValue.readUInt16BE();
      case 4:
        return this.binaryValue.readUInt32BE();
      case 8:
        return ((2 ** 32) * this.binaryValue.readUInt32BE()) + this.binaryValue.readUInt32BE(4);
      default:
        return 'Incorrect integer value length.';
    }
  }

  getIntegerValue() {
    switch (this.valueLength) {
      case 0:
        return 0;
      case 1:
        return this.binaryValue.readInt8();
      case 2:
        return this.binaryValue.readInt16BE();
      case 4:
        return this.binaryValue.readInt32BE();
      default:
        return 'Incorrect integer value length.';
    }
  }

  getFloatValue() {
    switch (this.valueLength) {
      case 4:
        return this.binaryValue.readFloatBE();
      case 8:
        return this.binaryValue.readDoubleBE();
      default:
        return 'Incorrect float value length.';
    }
  }

  getStringValue() {
    return this.binaryValue.toString('ascii');
  }

  getLeftovers() {
    return this.leftoverData;
  }
};

const parseTLV = function parseTLV(binaryData) {
  const objectsList = [];
  let object = new Instance(binaryData);
  objectsList.push(object);
  while (object.getLeftovers().length !== 0) {
    object = new Instance(object.getLeftovers());
    objectsList.push(object);
  }
  return objectsList;
};

module.exports = {
  parseTLV,
  Instance,
  TYPE_OBJECT,
  TYPE_MULTIPLE_RESOURCE,
  TYPE_RESOURCE_INSTANCE,
  TYPE_RESOURCE,
};
