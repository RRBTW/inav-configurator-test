'use strict';

const path = require('path');
const fs = require('fs');

const { GUI, TABS } = require('./../js/gui');
const tabs = require('./../js/tabs');
const i18n = require('./../js/localization');
const Settings = require('./../js/settings');
const mspHelper = require('./../js/msp/MSPHelper');
const CONFIGURATOR = require('./../js/data_storage');

// Подтягиваем оригинальные вкладки — они регистрируют TABS.osd._render / TABS.sensors._render
require('./osd');
require('./sensors');

TABS.osd_sensors = {};

TABS.osd_sensors.initialize = function (callback) {

    if (GUI.active_tab !== 'osd_sensors') {
        GUI.active_tab = 'osd_sensors';
    }

    const connected = CONFIGURATOR.connectionValid;

    const doLoad = function () {
        GUI.load(path.join(__dirname, "osd_sensors.html"), function () {

            const sensorsHtml = fs.readFileSync(path.join(__dirname, "sensors.html"), 'utf-8');
            $('#osd_sensors_sensors').html(sensorsHtml);

            if (connected) {
                const osdHtml = fs.readFileSync(path.join(__dirname, "osd.html"), 'utf-8');
                $('#osd_sensors_osd').html(osdHtml);
            }

            i18n.localize();

            if (connected) {
                Settings.processHtml(function () {
                    TABS.osd._render(function () {
                        TABS.sensors._render(function () {
                            tabs.init($('.tab-osd_sensors'));
                            GUI.content_ready(callback);
                        });
                    });
                })();
            } else {
                // Without FC: show placeholder in OSD panel and activate Sensors tab by default
                $('#osd_sensors_osd').html(
                    '<div style="padding:40px;text-align:center;color:#888;">' +
                    '<p style="font-size:1.2em;">Connect to FC to access OSD settings</p>' +
                    '</div>'
                );
                // Switch active subtab to Sensors
                $('.subtab__header_label[for="osd_sensors_osd"]').removeClass('subtab__header_label--current');
                $('.subtab__header_label[for="osd_sensors_sensors"]').addClass('subtab__header_label--current');
                $('#osd_sensors_osd').removeClass('subtab__content--current');
                $('#osd_sensors_sensors').addClass('subtab__content--current');

                TABS.sensors._render(function () {
                    tabs.init($('.tab-osd_sensors'));
                    GUI.content_ready(callback);
                });
            }
        });
    };

    if (connected) {
        mspHelper.loadServoMixRules();
        mspHelper.loadLogicConditions();
        HARDWARE.update(doLoad);
    } else {
        doLoad();
    }
};

TABS.osd_sensors.cleanup = function (callback) {
    if (TABS.osd && typeof TABS.osd.cleanup === 'function') {
        TABS.osd.cleanup(function () {});
    }
    if (TABS.sensors && typeof TABS.sensors.cleanup === 'function') {
        TABS.sensors.cleanup(function () {});
    }
    if (callback) callback();
};
