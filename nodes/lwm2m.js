'use strict';
const TYPE_OBJECT = 0;
const TYPE_MULTIPLE_RESOURCE = 1;
const TYPE_RESOURCE_INSTANCE = 2;
const TYPE_RESOURCE = 3;

const Instance = class Instance {
  constructor(binaryData) {
    const identifierAndLength = this.readType(binaryData);
    binaryData = binaryData.slice(1);
    this.identifier = binaryToInteger(binaryData.slice(0, identifierAndLength[0]));
    binaryData = binaryData.slice(identifierAndLength[0]);
    this.readLength(binaryData, identifierAndLength[1]);
    binaryData = binaryData.slice(identifierAndLength[1]);
    this.leftoverData = this.readValue(binaryData).slice(this.valueLength);
  }
  
  readType(binaryData) {
    let firstByte = (binaryToBitString(binaryData.slice(0, 1))).split("");
    firstByte = Array(8-firstByte.length).fill('0').concat(firstByte);
    this.type = parseInt(firstByte[0] + firstByte[1], 2);
    const identifierLength = parseInt(firstByte[2], 2) + 1;
    const lengthType = parseInt((firstByte[3] + firstByte[4]), 2);
    const valueLength = parseInt((firstByte[5] + firstByte[6] + firstByte[7]), 2);
    if(lengthType === 0) {
      this.valueLength = valueLength;
    }
    return [
      identifierLength,
      lengthType
    ];
  }

  readIdentifier(binaryData, identifierLength) {
    this.identifier = binaryToInteger(binaryData.slice(0, identifierLength));
  }
  
  readLength(binaryData, lengthType) {
    if (lengthType != 0) {
      this.valueLength = binaryToInteger(binaryData.slice(0, lengthType));
    }
  }
  
  readValue(binaryData) {
    switch(this.type) {
      case TYPE_OBJECT:
        this.valueObject = new Instance(binaryData.slice(0, this.valueLength));
        break;

      case TYPE_MULTIPLE_RESOURCE:
        // TODO: Add multiple resource instance support (Type 1 and 2)
        //this contains one of multiple resource values
        break;

      case TYPE_RESOURCE_INSTANCE:
        // TODO: Add multiple resource instance support (Type 1 and 2)
        //this contains multiple resources
        break;

      case TYPE_RESOURCE:
        this.binaryValue = binaryData.slice(0, this.valueLength);
        break;
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
    }
  }

  getBinaryValue() {
    return binaryToBitString(this.binaryValue);
  }

  getBooleanValue() {
    if (this.getBinaryValue().slice(-1)) {
      return true;
    } else {
      return false;
    }

  }

  getUnsignedIntegerValue() {
    switch (this.valueLength) {
      case 1:
        return this.binaryValue.readUInt8BE(0);

      case 2:
        return this.binaryValue.readUInt16BE(0);

      case 4:
        return this.binaryValue.readUInt32BE(0);

      default:
        return 'Value length is incorrect for integer.'
      }
  }

  getIntegerValue() {
    switch (this.valueLength) {
      case 1:
        return this.binaryValue.readInt8BE(0);

      case 2:
        return this.binaryValue.readInt16BE(0);

      case 4:
        return this.binaryValue.readInt32BE(0);

      default:
        return 'Value length is incorrect for integer.'
      }
  }

  getFloatValue() {
    switch (this.valueLength) {
      case 4:
        return this.binaryValue.readFloatBE(0);

      case 8:
        return this.binaryValue.readDoubleBE(0);

      default:
        return 'Value length is incorrect for float.'
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
  let objectsList = [];
  let object = new Instance(binaryData)
  objectsList.push(object);
  while(object.getLeftovers().length != 0) {
    let object = new Instance(object.getLeftovers())
    objectsList.push(object);
  }
  return objectsList;
};

function binaryToBitString(binaryData) {
  return binaryToInteger(binaryData).toString(2);
}

function binaryToInteger(binaryData) {
  return parseInt(binaryData.toString('hex'), 16);
}

module.exports = {
  parseTLV,
  Instance,
  TYPE_OBJECT,
  TYPE_MULTIPLE_RESOURCE,
  TYPE_RESOURCE_INSTANCE,
  TYPE_RESOURCE
}
