/**
 * Created by Anton on 08.04.2015.
 */
var profileManager = {
    domCache: {
        managerBody: document.getElementById('manager'),
        trackerList: document.querySelector('.mgr-tracker-list'),
        filterInput: document.getElementById('manager_search'),
        filterContainer: document.querySelector('.mgr-tracker-list-filter'),
        counter: document.getElementById('manager_counter'),
        title: document.getElementById('manager_title'),
        profileName: document.getElementById('manager_list_title'),
        closeBtn: document.getElementById('manager_close'),
        removeListBtn: document.getElementById('manager_remove_list'),
        extendView: document.getElementById('manager_extend_view'),
        saveBtn: document.getElementById('manager_save'),
        addCustomTrackerBtn: document.getElementById('manager_add_custom'),
        createCustomTrackerBtn: document.getElementById('manager_create_custom')
    },
    varCache: {
        filterList: {
            all: {lang: 'all'},
            hasList: {lang: 'withoutList'},
            custom: {lang: 'externalList'},
            selected: {selected: 1, lang: 'selectedItems'}
        },
        filterStyle: undefined,
        wordFilterCache: {},
        wordFilterStyle: undefined,
        trackerList: {},
        selectedFilter: undefined,
        currentProfileName: undefined
    },
    updateProfileList: function(currentProfile, changes, cb) {
        "use strict";
        engine.setProfileList(changes, function() {
            engine.prepareProfileList(currentProfile, changes);
            view.writeProfileList();
            view.selectProfile(currentProfile || engine.currentProfile);
            cb && cb();
        });
    },
    filterValueUpdate: function() {
        var trackerList = this.domCache.trackerList;
        var selectCount = trackerList.querySelectorAll('.tracker-item.selected').length;
        if (!selectCount) {
            this.domCache.counter.textContent = mono.language.selectedNothing;
        } else {
            this.domCache.counter.textContent = mono.language.selectedCount + ' ' + selectCount;
        }

        for (var type in this.varCache.filterList) {
            var filterObj = this.varCache.filterList[type];
            if (type === 'all') {
                filterObj.setValue(trackerList.querySelectorAll('.tracker-item').length);
            } else
            if (type === 'selected') {
                filterObj.setValue(selectCount);
            } else
            if (type === 'hasList') {
                filterObj.setValue(trackerList.querySelectorAll('.tracker-item:not(.hasList)').length);
            } else
            if (type === 'custom') {
                filterObj.setValue(trackerList.querySelectorAll('.tracker-item.custom').length);
            }
        }
    },
    orderTrackerList: function () {
        var trackerList = this.domCache.trackerList;

        var tmpSelectedList = trackerList.querySelectorAll(['.tmp-selected', '.tmp-hasList']);
        for (var i = 0, el; el = tmpSelectedList[i]; i++) {
            el.classList.remove('tmp-selected');
            el.classList.remove('tmp-hasList');
        }

        var list = document.createDocumentFragment();
        var selectedList = mono.nodeListToArray(trackerList.querySelectorAll('.tracker-item.selected:not(.not-found)'));
        selectedList = selectedList.concat(mono.nodeListToArray(trackerList.querySelectorAll('.tracker-item.selected.not-found')));
        for (i = 0, el; el = selectedList[i]; i++) {
            list.appendChild(el);
        }
        if (trackerList.firstChild !== null) {
            trackerList.insertBefore(list, trackerList.firstChild);
        } else {
            trackerList.appendChild(list);
        }
    },
    trackerInProfile: function(profileList, trackerId) {
        "use strict";
        for (var i = 0, item; item = profileList[i]; i++) {
            if (typeof item === 'object') {
                if (item.id === trackerId) {
                    return true;
                }
            } else
            if (item === trackerId) {
                return true;
            }
        }
        return false;
    },
    trackerHasListUpdate: function (trackerObj) {
        var state;
        if (trackerObj.selected) {
            state = true;
        } else {
            for (var profileName in engine.profileList) {
                if (profileName === this.varCache.currentProfileName) {
                    continue;
                }
                var trackerList = engine.profileList[profileName];
                if (this.trackerInProfile(trackerList, trackerObj.id)) {
                    state = true;
                    break;
                }
            }
        }

        if (trackerObj.hasList === state) return;

        if (trackerObj.hasList) {
            trackerObj.el.classList.remove('hasList');
        } else {
            trackerObj.el.classList.add('hasList');
            if (this.varCache.selectedFilter.type === 'hasList') {
                trackerObj.el.classList.add('tmp-hasList');
            }
        }
        trackerObj.hasList = state;
    },
    trackerObjSelect: function(trackerObj, state) {
        "use strict";
        if (trackerObj.selected === state) return;

        if (trackerObj.selected) {
            trackerObj.el.classList.remove('selected');
            if (this.varCache.selectedFilter.type === 'selected') {
                trackerObj.el.classList.add('tmp-selected');
            }
        } else {
            trackerObj.el.classList.add('selected');
        }
        trackerObj.selected = state;
        trackerObj.checkbox.checked = !!state;

        trackerObj.hasListUpdate();

        this.filterValueUpdate();
    },
    getTrackerEl: function(trackerObj, selected, hasList, notFound, proxyIndex) {
        "use strict";
        var prevTrackerItem = this.varCache.trackerList[trackerObj.id] || {};
        var trackerItem = this.varCache.trackerList[trackerObj.id] = {};
        trackerItem.id = trackerObj.id;
        trackerItem.proxyIndex = proxyIndex || prevTrackerItem.proxyIndex || 0;
        var classList = ['tracker-item'];
        if (selected) {
            trackerItem.selected = 1;
            classList.push('selected');
        } else {
            trackerItem.selected = 0;
        }
        if (hasList) {
            classList.push('hasList');
        }
        if (trackerObj.code) {
            classList.push('custom');
        }
        trackerItem.hasList = hasList;

        notFound && classList.push('not-found');

        trackerItem.el = mono.create('div', {
            class: classList,
            data: {
                id: trackerObj.id
            },
            append: [
                mono.create('i', {
                    class: 'icon',
                    style: 'background-image: url('+ exKit.getTrackerIconUrl(trackerObj.icon) +')'
                }),
                mono.create('div', {
                    class: 'title',
                    append: mono.create('a', {
                        title: trackerObj.title,
                        text: trackerObj.title,
                        href: trackerObj.search.baseUrl,
                        target: '_blank'
                    })
                }),
                trackerItem.desc = mono.create('div', {
                    class: 'desc',
                    append: [
                        mono.create('div', {
                            class: 'text',
                            text: trackerObj.desc,
                            title: trackerObj.desc
                        }),
                        mono.create('div', {
                            class: 'extend',
                            append: [
                                mono.language.requestContentVia,
                                mono.create('select', {
                                    name: 'proxyIndex',
                                    append: (function(proxyList) {
                                        proxyList = [{label: mono.language.direct}].concat(proxyList);
                                        var list = [];
                                        var option;
                                        for (var i = 0, item; item = proxyList[i]; i++) {
                                            list.push(option = mono.create('option', {
                                                text: item.label,
                                                value: i
                                            }));
                                        }
                                        return list;
                                    })(engine.settings.proxyList),
                                    onCreate: function() {
                                        this.selectedIndex = trackerItem.proxyIndex;
                                    },
                                    on: ['change', function(e) {
                                        trackerItem.proxyIndex = parseInt(this.value);
                                    }]
                                }),
                                mono.create('a', {
                                    class: ['act-btn', 'edit'],
                                    href: '#',
                                    title: mono.language.edit,
                                    on: ['click', function(e) {
                                        e.preventDefault();
                                        e.stopPropagation();

                                        var _this = profileManager;

                                        var jsonEditor = null;
                                        var aceEditor = null;
                                        var jsonEditorCtr = null;
                                        var aceEditorCtr = null;

                                        var setJson = function(json) {
                                            if (jsonEditorCtr.dataset.isHidden === '1') {
                                                aceEditor.setValue(JSON.stringify(json, null, 2));
                                            } else {
                                                jsonEditor.set(json);
                                            }
                                        };

                                        var getJson = function() {
                                            var json = {};
                                            if (jsonEditorCtr.dataset.isHidden === '1') {
                                                try {
                                                    json = JSON.parse(aceEditor.getValue());
                                                } catch (e) {}
                                            } else {
                                                json = jsonEditor.get();
                                            }
                                            return json;
                                        };

                                        var origTrackerObj = engine.origTrackerLib[trackerObj.id] || engine.trackerLib[trackerObj.id];

                                        var layer = new mono.Layer({
                                            title: mono.language.editing,
                                            onSave: function() {
                                                var json = getJson();
                                                var diff = mono.diffObj(origTrackerObj, json, ['[Function]']);

                                                delete diff.id;

                                                if (Object.keys(diff).length === 0) {
                                                    diff = undefined;
                                                }

                                                engine.extendTrackerList[origTrackerObj.id] = diff;

                                                var storage = {
                                                    extendTrackerList: engine.extendTrackerList
                                                };

                                                mono.storage.set(storage, function() {
                                                    if (engine.settings.profileListSync) {
                                                        mono.storage.sync.set(storage);
                                                    }
                                                });

                                                exKit.extendTrackerLib();

                                                _this.updateTrackerItem(origTrackerObj.id);
                                            }
                                        });

                                        mono.create(layer.blocks.head, {
                                            style: {
                                                backgroundColor: '#3883fa',
                                                color: '#fff'
                                            }
                                        });

                                        mono.create(layer.blocks.footer, {
                                            append: [
                                                mono.create('a', {
                                                    text: mono.language.reset,
                                                    class: ['btn', 'reset'],
                                                    href: '#',
                                                    on: ['click', function(e) {
                                                        e.preventDefault();

                                                        var json = mono.deepClone(origTrackerObj, function(value) {
                                                            if (typeof value === 'function') {
                                                                return '[Function]';
                                                            }
                                                            return value;
                                                        });

                                                        return setJson(json);
                                                    }]
                                                })
                                            ]
                                        });

                                        define.on('jsoneditor', function() {
                                            var options = {};

                                            var container = jsonEditorCtr = mono.create('div', {
                                                id: 'JSONEditor'
                                            });

                                            layer.blocks.body.appendChild(container);

                                            jsonEditor = new JSONEditor(container, options);

                                            var json = mono.deepClone(trackerObj, function(value) {
                                                if (typeof value === 'function') {
                                                    return '[Function]';
                                                }
                                                return value;
                                            });

                                            setJson(json);

                                            return layer.show();
                                        });

                                        define.on('ace', function() {
                                            mono.create(layer.blocks.footer, {
                                                append: [
                                                    mono.create('a', {
                                                        text: '{ }',
                                                        class: ['btn', 'ace'],
                                                        href: '#',
                                                        style: {
                                                            padding: '0 10px',
                                                            marginLeft: '10px'
                                                        },
                                                        on: ['click', function(e) {
                                                            e.preventDefault();

                                                            var json = getJson();
                                                            if (jsonEditorCtr.dataset.isHidden === '1') {
                                                                jsonEditor.set(json);

                                                                aceEditorCtr.style.display = 'none';
                                                                jsonEditorCtr.style.display = 'block';
                                                                jsonEditorCtr.dataset.isHidden = '0';
                                                            } else {
                                                                aceEditor.setValue(JSON.stringify(json, null, 2));

                                                                jsonEditorCtr.style.display = 'none';
                                                                aceEditorCtr.style.display = 'block';
                                                                jsonEditorCtr.dataset.isHidden = '1';
                                                            }
                                                        }]
                                                    })
                                                ]
                                            });

                                            var container = aceEditorCtr = mono.create('div', {
                                                class: 'aceEditor',
                                                style: {
                                                    display: 'none',
                                                    position: 'absolute',
                                                    width: '700px',
                                                    height: '490px',
                                                    fontSize: '10pt',
                                                    fontFamily: 'droid sans mono,consolas,monospace,courier new,courier,sans-serif;'
                                                }
                                            });

                                            layer.blocks.body.appendChild(container);

                                            aceEditor = ace.edit(container);
                                            aceEditor.$blockScrolling = Infinity;
                                            aceEditor.setTheme("ace/theme/chrome");
                                            aceEditor.getSession().setOption("useWorker", false);
                                            aceEditor.getSession().setMode("ace/mode/json");
                                            aceEditor.getSession().setUseWrapMode(true);
                                        });

                                        if (!define.amd['jsoneditor']) {
                                            document.body.appendChild(mono.create('link', {
                                                rel: 'stylesheet',
                                                type: 'text/css',
                                                href: 'css/jsoneditor.min.css'
                                            }));
                                            document.body.appendChild(mono.create('script', {src: 'lib/jsoneditor.min.js'}));
                                        }

                                        if (!define.amd['ace']) {
                                            document.body.appendChild(mono.create('script', {src: 'lib/ace/ace.js'}));
                                            (function wait(limit) {
                                                setTimeout(function() {
                                                    if (window.ace) {
                                                        define('ace');
                                                    } else
                                                    if (limit > 0) {
                                                        return wait(--limit);
                                                    }
                                                }, 250);
                                            })(30 * 4 * 1000);
                                        }
                                    }]
                                })
                            ]
                        })
                    ]
                }),
                mono.create('div', {
                    class: 'action',
                    append: [
                        !trackerObj.code ? undefined : mono.create('a', {
                            class: ['act-btn', 'edit'],
                            href: '#',
                            title: mono.language.edit,
                            on: ['click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();

                                var container = this.parentNode.parentNode;
                                var id = container.dataset.id;

                                var _this = profileManager;
                                var $body = showNotification([
                                    [{label: {text: mono.language.copyAndEnterTrackerCode}}],
                                    {textarea: {name: 'code', text: engine.trackerLib[id] && engine.trackerLib[id].code || ''}},
                                    [
                                        {input: {type: "button", value: mono.language.change, name: 'yesBtn', on: ['click', function(e) {
                                            e.stopPropagation();
                                            var formData = this.getFormData();

                                            try {
                                                var json = JSON.parse(formData.code);
                                            } catch (e) {
                                                alert(mono.language.trackerCodeReadError + "\n" + e);
                                                return;
                                            }

                                            if (!json.uid) {
                                                alert(mono.language.trackerCodeReadError);
                                                return;
                                            }

                                            delete engine.trackerLib[id];
                                            if (id.substr(0,3) === 'ct_') {
                                                json.uid = parseInt(id.substr(3));
                                            }

                                            this.close();

                                            var trackerObj = exKit.prepareCustomTracker(json);

                                            _this.updateTrackerItem(trackerObj.id);

                                            _this.filterValueUpdate();
                                            _this.filterBy('custom');

                                            mono.storage.get('customTorrentList', function(storage) {
                                                var customTorrentList = storage.customTorrentList || {};
                                                customTorrentList[trackerObj.id] = json;
                                                mono.storage.set({customTorrentList: customTorrentList});
                                            });
                                        }]}},
                                        {input: {type: "button", value: mono.language.cancel, name: 'noBtn', on: ['click', function(e) {
                                            e.stopPropagation();
                                            this.close();
                                        }]}}
                                    ]
                                ]);
                                $body.addClass('custom-tracker');
                                $body.on('click', function(e) {
                                    e.stopPropagation();
                                });
                            }]
                        }),
                        !trackerObj.code ? undefined : mono.create('a', {
                            class: ['act-btn', 'remove'],
                            href: '#',
                            title: mono.language.delete,
                            on: ['click', function(e) {
                                e.preventDefault();
                                e.stopPropagation();

                                var container = this.parentNode.parentNode;
                                var id = container.dataset.id;

                                delete engine.trackerLib[id];
                                profileManager.updateTrackerItem(id, 1);

                                profileManager.filterValueUpdate();
                                profileManager.filterBy('custom');

                                mono.storage.get('customTorrentList', function(storage) {
                                    var customTorrentList = storage.customTorrentList || {};
                                    delete customTorrentList[id];
                                    mono.storage.set({customTorrentList: customTorrentList});
                                });
                            }]
                        }),
                        trackerItem.checkbox = mono.create('input', {
                            type: 'checkbox',
                            checked: !!selected
                        })
                    ]
                })
            ]
        });
        trackerItem.select = this.trackerObjSelect.bind(this, trackerItem);
        trackerItem.hasListUpdate = this.trackerHasListUpdate.bind(this, trackerItem);
        return trackerItem.el;
    },
    trackerInList: function(trackerObj) {
        "use strict";
        for (var profileName in engine.profileList) {
            if (this.trackerInProfile(engine.profileList[profileName], trackerObj.id)) {
                return true;
            }
        }
    },
    getRemovedTrackerObj: function(trackerId) {
        "use strict";
        var customId = trackerId.substr(0, 3) === 'ct_' ? trackerId.substr(3) : trackerId;
        return {
            id: trackerId,
            icon: '#skull',
            title: trackerId,
            search: {
                baseUrl: 'http://code-tms.blogspot.ru/search?q=' + encodeURIComponent(customId)
            },
            code: trackerId.substr(0, 3) === 'ct_' ? '{}' : undefined,
            desc: mono.language.trackerIsNotFound
        };
    },
    updateTrackerItem: function(trackerId, isRemove) {
        "use strict";
        var el = this.domCache.trackerList.querySelector('div[data-id="' + trackerId + '"]');

        var trackerObj = engine.trackerLib[trackerId];

        var notFound;
        if (!trackerObj) {
            trackerObj = this.getRemovedTrackerObj(trackerId);
            notFound = true;
        }
        var hasList = notFound ? true : this.trackerInList(trackerObj);

        var selected = el && el.classList.contains('selected');

        var newEl = this.getTrackerEl(trackerObj, selected, hasList, notFound, null);

        if (!el) {
            this.domCache.trackerList.appendChild(newEl);
        } else {
            this.domCache.trackerList.replaceChild(newEl, el);
        }
        if (isRemove && !selected) {
            this.domCache.trackerList.removeChild(newEl);
        }
    },
    writeTrackerList: function(profileName) {
        "use strict";
        var trackerList = engine.profileList[profileName] || [];
        this.domCache.trackerList.textContent = '';
        mono.create(this.domCache.trackerList, {
            append: function() {
                var list = [];
                var hasIdList = [];
                var trackerItem, trackerId, selected, hasList, notFound, i, proxyIndex;
                for (i = 0; trackerItem = trackerList[i]; i++) {
                    trackerId = trackerItem;
                    proxyIndex = 0;
                    if (typeof trackerId === 'object') {
                        proxyIndex = trackerId.proxyIndex || 0;
                        trackerId = trackerId.id;
                    }
                    hasIdList.push(trackerId);
                    var trackerObj = engine.trackerLib[trackerId];
                    if (!trackerObj) {
                        trackerObj = this.getRemovedTrackerObj(trackerId);
                        hasList = true;
                        selected = true;
                        notFound = true;
                    } else {
                        hasList = this.trackerInList(trackerObj);
                        selected = this.trackerInProfile(trackerList, trackerObj.id);
                        notFound = false;
                    }
                    list.push(this.getTrackerEl(trackerObj, selected, hasList, notFound, proxyIndex));
                }
                for (trackerId in engine.trackerLib) {
                    if (hasIdList.indexOf(trackerId) !== -1) {
                        continue;
                    }
                    hasIdList.push(trackerId);

                    trackerObj = engine.trackerLib[trackerId];
                    hasList = this.trackerInList(trackerObj);
                    selected = this.trackerInProfile(trackerList, trackerObj.id);
                    list.push(this.getTrackerEl(trackerObj, selected, hasList, null, null));
                }
                return list;
            }.call(this)
        });
    },
    getSelectedTrackerList: function() {
        "use strict";
        var elList = this.domCache.trackerList.querySelectorAll('.tracker-item.selected');
        var list = [];
        for (var i = 0, el; el = elList[i]; i++) {
            var trackerObj = this.varCache.trackerList[el.dataset.id];
            var trackerListItem = {id: trackerObj.id};
            if (trackerObj.proxyIndex) {
                trackerListItem.proxyIndex = trackerObj.proxyIndex;
            }
            list.push(trackerListItem);
        }
        return list;
    },
    filterBy: function(type) {
        this.varCache.filterList[type].select(1);

        if (this.varCache.filterStyle) {
            this.varCache.filterStyle.parentNode.removeChild(this.varCache.filterStyle);
            this.varCache.filterStyle = undefined;
        }

        if (type === 'selected') {
            this.varCache.filterStyle = mono.create('style', {
                text: '#manager '
                + '.mgr-tracker-list > div:not(.selected) {'
                +    'display: none;'
                + '}'
                + '#manager '
                +    '.mgr-tracker-list > div.tmp-selected {'
                +    'display: block;'
                + '}'
            });
        } else
        if (type === 'hasList') {
            this.varCache.filterStyle = mono.create('style', {
                text: '#manager '
                + '.mgr-tracker-list > div.hasList {'
                +   'display: none;'
                + '}'
                + '#manager '
                +   '.mgr-tracker-list > div.hasList.tmp-hasList {'
                +   'display: block;'
                + '}'
            });
        } else
        if (type === 'custom') {
            this.varCache.filterStyle = mono.create('style', {
                text: '#manager '
                + '.mgr-tracker-list > div:not(.custom) {'
                +   'display: none;'
                + '}'
            });
            this.domCache.managerBody.classList.add('show-tools');
        }

        this.varCache.filterStyle && document.body.appendChild(this.varCache.filterStyle);
    },
    filterSetValue: function(filterObj, value) {
        "use strict";
        if (filterObj.value === value) return;

        filterObj.value = value;
        filterObj.valueEl.textContent = value;
    },
    filterSelect: function(filterObj, state) {
        "use strict";
        if (filterObj.selected === state) return;

        this.varCache.selectedFilter.selected = 0;
        this.varCache.selectedFilter.el.classList.remove('selected');

        if (this.varCache.selectedFilter.type === 'custom') {
            this.domCache.managerBody.classList.remove('show-tools');
        }

        this.varCache.selectedFilter = filterObj;
        filterObj.selected = state;
        this.varCache.selectedFilter.el.classList.add('selected');

        if (state && filterObj.type === 'custom') {
            this.domCache.managerBody.classList.add('show-tools');
        }
    },
    writeFilterList: function() {
        "use strict";
        var filterContainer = this.domCache.filterContainer;
        var list = document.createDocumentFragment();
        for (var type in this.varCache.filterList) {
            var filterObj = this.varCache.filterList[type];
            var classList = [];
            if (filterObj.selected) {
                classList.push('selected');
                this.varCache.selectedFilter = filterObj;
            } else {
                filterObj.selected = 0;
            }
            list.appendChild(filterObj.el = mono.create('a', {
                class: classList,
                data: {
                    type: type
                },
                href: '#',
                text: mono.language[filterObj.lang] + ' ',
                append: filterObj.valueEl = mono.create('i', {
                    text: 0
                })
            }));
            filterObj.type = type;
            filterObj.value = 0;
            filterObj.setValue = this.filterSetValue.bind(this, filterObj);
            filterObj.select = this.filterSelect.bind(this, filterObj);
        }
        filterContainer.insertBefore(list, filterContainer.firstChild);
    },
    onFilterKeyUp: function() {
        "use strict";
        if (this.varCache.wordFilterStyle !== undefined) {
            this.varCache.wordFilterStyle.parentNode.removeChild(this.varCache.wordFilterStyle);
            this.varCache.wordFilterStyle = undefined;

            var elList = this.domCache.trackerList.querySelectorAll('div[data-filtered="true"]');
            for (var i = 0, el; el = elList[i]; i++) {
                el.dataset.filtered = false;
            }
        }

        var request = this.domCache.filterInput.value.toLowerCase().trim();
        if (!request) {
            return;
        }

        if (this.varCache.selectedFilter.type === 'selected') {
            this.filterBy('all');
        }

        var trackerItemList = this.varCache.trackerList;
        var trackerLib = engine.trackerLib;
        var trackerObjList = mono.nodeListToArray(this.domCache.trackerList.querySelectorAll('.tracker-item'));
        trackerObjList.filter(function(el) {
            var id = el.dataset.id;
            var trackerObj = trackerLib[id] || {search: {}};
            var trackerItem = trackerItemList[id];

            var text = this.varCache.wordFilterCache[id];
            if (text === undefined) {
                text = (trackerObj.desc || '').toLowerCase();
                text += ' ' + (trackerObj.search.baseUrl || '').toLowerCase();
                text += ' ' + (trackerObj.title || '').toLowerCase();
                this.varCache.wordFilterCache[id] = text;
            }

            if (text.indexOf(request) !== -1) {
                trackerItem.el.dataset.filtered = true;
                return true;
            }
            return false;
        }.bind(this));

        document.body.appendChild(this.varCache.wordFilterStyle = mono.create('style', {
            text: ''
            + '#manager .mgr-tracker-list > div:not([data-filtered="true"]) {'
            +   'display: none;'
            + '}'
        }));
    },
    once: function() {
        "use strict";
        if (this.once.ready) return;
        this.once.ready = 1;

        var _this = this;

        this.writeFilterList();

        this.domCache.managerBody.addEventListener('click', function(e) {
            e.stopPropagation();
        });

        this.domCache.closeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            this.onHide();
        }.bind(this));

        this.domCache.saveBtn.addEventListener('click', function(e) {
            e.preventDefault();

            var profileName = this.domCache.profileName.value.trim() || this.varCache.currentProfileName;
            if (!profileName) {
                this.domCache.profileName.classList.add('error');
                setTimeout(function() {
                    this.domCache.profileName.classList.remove('error');
                }.bind(this), 1500);
                return;
            }

            var trackerList = this.getSelectedTrackerList();

            engine.profileList[profileName] = trackerList;

            if (this.varCache.currentProfileName !== profileName) {
                delete engine.profileList[this.varCache.currentProfileName];
            }

            engine.updProfileArr();

            var changes = {
                profileList: engine.profileArr
            };

            this.updateProfileList(profileName, changes, function () {
                this.onHide();
            }.bind(this));
        }.bind(this));

        this.domCache.removeListBtn.addEventListener('click', function(e) {
            e.preventDefault();

            delete engine.profileList[this.varCache.currentProfileName];

            engine.updProfileArr();

            var changes = {
                profileList: engine.profileArr
            };

            this.updateProfileList(undefined, changes, function () {
                this.onHide();
            }.bind(this));
        }.bind(this));

        this.domCache.filterContainer.addEventListener('click', function(e) {
            var el = e.target;
            if (this === el) return;
            while (el.parentNode !== this) {
                el = el.parentNode;
                if (el === null) {
                    return;
                }
            }

            var type = el.dataset.type;
            if (!type) return;

            e.preventDefault();
            var _this = profileManager;
            _this.orderTrackerList();
            _this.filterBy(type);
        });

        this.domCache.trackerList.addEventListener('click', function(e) {
            var el = e.target;
            if (el.tagName === 'A' || el.tagName === 'SELECT') return;

            if (this === el) return;
            while (el.parentNode !== this) {
                el = el.parentNode;
                if (el === null) {
                    return;
                }
            }

            var _this = profileManager;
            var trackerObj = _this.varCache.trackerList[el.dataset.id];
            trackerObj.select(!trackerObj.selected ? 1 : 0)
        });

        this.domCache.extendView.addEventListener('click', function(e) {
            e.preventDefault();
            if (this.classList.contains('checked')) {
                profileManager.domCache.managerBody.classList.remove('extend');
                this.classList.remove('checked');
            } else {
                profileManager.domCache.managerBody.classList.add('extend');
                this.classList.add('checked');
            }
        });

        this.domCache.addCustomTrackerBtn.addEventListener('click', function(e) {
            e.preventDefault();
            var _this = this;
            var $body = showNotification([
                [{label: {text: mono.language.copyAndEnterTrackerCode}}],
                {textarea: {name: 'code'}},
                [
                    {input: {type: "button", value: mono.language.add, name: 'yesBtn', on: ['click', function(e) {
                        e.stopPropagation();
                        var formData = this.getFormData();

                        try {
                            var json = JSON.parse(formData.code);
                        } catch (e) {
                            alert(mono.language.trackerCodeReadError + "\n" + e);
                            return;
                        }

                        if (!json.uid) {
                            alert(mono.language.trackerCodeReadError);
                            return;
                        }

                        this.close();

                        var trackerObj = exKit.prepareCustomTracker(json);
                        if (!trackerObj) {
                            alert(mono.language.trackerExists);
                            return;
                        }

                        _this.updateTrackerItem(trackerObj.id);

                        _this.filterValueUpdate();
                        _this.filterBy('custom');

                        mono.storage.get('customTorrentList', function(storage) {
                            var customTorrentList = storage.customTorrentList || {};
                            customTorrentList[trackerObj.id] = json;
                            mono.storage.set({customTorrentList: customTorrentList});
                        });
                    }]}},
                    {input: {type: "button", value: mono.language.cancel, name: 'noBtn', on: ['click', function(e) {
                        e.stopPropagation();
                        this.close();
                    }]}}
                ]
            ]);
            $body.addClass('custom-tracker');
            $body.on('click', function(e) {
                e.stopPropagation();
            });
        }.bind(this));

        this.domCache.filterInput.addEventListener('keyup', mono.throttle(profileManager.onFilterKeyUp, 250, this));

        this.domCache.filterInput.addEventListener('dblclick', function() {
            this.value = '';
            this.dispatchEvent(new CustomEvent('keyup'));
        });

        define.on(['jquery', 'jqueryui'], function() {
            $(_this.domCache.trackerList).sortable({
                placeholder: "ui-state-highlight",
                delay: 150
            });
        });
    },
    isShow: function() {
        "use strict";
        return this.domCache.managerBody.classList.contains('show');
    },
    onShow: function() {
        "use strict";
        this.domCache.managerBody.classList.add('show');
        document.body.addEventListener('click', function onBodyClick() {
            document.body.removeEventListener('click', onBodyClick);
            this.onHide();
        }.bind(this));
    },
    onHide: function() {
        "use strict";
        this.domCache.managerBody.classList.remove('show');
        this.varCache.currentProfileName = undefined;
        this.domCache.trackerList.textContent = '';
        this.domCache.profileName.value = '';
        this.varCache.trackerList = {};
        this.domCache.filterInput.dispatchEvent(new CustomEvent('dblclick'));
        if (this.domCache.extendView.classList.contains('checked')) {
            this.domCache.extendView.dispatchEvent(new CustomEvent('click', {cancelable: true}));
        }
    },
    add: function() {
        "use strict";
        this.once();
        if (this.isShow()) {
            this.onHide();
        }
        this.onShow();

        this.domCache.title.textContent = mono.language.addTrackerList;
        this.domCache.removeListBtn.classList.add('hide');
        this.domCache.profileName.focus();

        this.writeTrackerList();
        this.filterValueUpdate();
        this.filterBy('all');
    },
    edit: function(profileName) {
        "use strict";
        this.once();
        if (this.isShow()) {
            this.onHide();
        }
        this.onShow();

        this.domCache.title.textContent = mono.language.editTrackerList;
        this.varCache.currentProfileName = profileName;
        this.domCache.profileName.value = profileName.replace('%defaultProfileName%', mono.language.defaultProfileName);
        this.domCache.removeListBtn.classList.remove('hide');

        this.writeTrackerList(profileName);
        this.filterValueUpdate();
        this.filterBy('selected');
    }
};