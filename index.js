'use strict';

let Accessory, hap, UUIDGen;
const Nest = require('./lib/nest').NestAPI;
const GoogleAuth = require('./lib/google-auth.js');
const Promise = require('bluebird');

module.exports = (homebridge) => {
  Accessory = homebridge.platformAccessory;
  hap = homebridge.hap;
  UUIDGen = homebridge.hap.uuid;

  homebridge.registerPlatform('homebridge-nest-cam', 'Nest-cam', NestCamPlatform, true);
}

const getGoogleAuth = function(config, log) {
    return new Promise(function (resolve, reject) {
        const conn = new GoogleAuth(config, log);
        conn.auth().then(connected => {
            if (connected) {
                resolve(conn);
            } else {
                reject('Unable to connect to Google authentication service.');
            }
        });
    });
};

class NestCamPlatform {
  constructor(log, config, api) {
    let self = this;
    self.log = log;
    self.config = config || {};
    if (api) {
      self.api = api;
      if (api.version < 2.1) {
        throw new Error('Unexpected API version.');
      }

      self.api.on('didFinishLaunching', self.didFinishLaunching.bind(this));
    }
  }

  configureAccessory(accessory) {
    // Won't be invoked
  }

  didFinishLaunching() {
    let self = this;
    let accessToken = self.config['access_token'];
    if ( typeof accessToken == 'undefined' )
    {
      let googleAuth = self.config['googleAuth'];
      if ( typeof googleAuth == 'undefined')
      {
        throw new Error('access_token is not defined in the Homebridge config');
      }
      getGoogleAuth(self.config, self.log)
        .catch(function(err) {
          that.log.error(err);
        });
    }
    self.nestAPI = new Nest(accessToken);
    self.nestAPI.on('cameras', (cameras) => {
      let configuredAccessories = [];
      cameras.forEach((camera) => {
        camera.configureWithHAP(hap, self.config);
        let name = camera.name;
        let uuid = UUIDGen.generate(camera.uuid);
        let accessory = new Accessory(name, uuid, hap.Accessory.Categories.CAMERA);
        self.log('Create camera - ' + name);
        accessory.configureCameraSource(camera);
        configuredAccessories.push(accessory);
      });
      self.api.publishCameraAccessories('Nest-cam', configuredAccessories);
    });
    self.nestAPI.fetchSessionTokenAndUpdateCameras();
  }
}
