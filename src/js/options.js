var options = {
    activePage: null,
    activeItem: undefined,
    domCache: {
        backupUpdateBtn: document.getElementById('backupUpdate'),
        restoreBtn: document.getElementById('restoreBtn'),
        saveInCloudBtn: document.getElementById('saveInCloud'),
        getFromCloudBtn: document.getElementById('getFromCloudBtn'),
        clearCloudStorageBtn: document.getElementById('clearCloudStorage'),
        backupInp: document.getElementById('backupInp'),
        restoreInp: document.getElementById('restoreInp'),
        langSelect: document.getElementById("language"),
        sectionList: document.querySelector('.sectionList'),
        qualityList: document.querySelector('.qualityList'),
        proxyList: document.querySelector('.proxyList')
    },

    defaultSettings: {},
    settings: {},

    set_place_holder: function() {
        "use strict";
        for (var key in engine.defaultSettings) {
            var defaultValue = engine.defaultSettings[key];
            var el = document.querySelector('input[data-option="' + key + '"]');
            if (el === null) {
                console.log('El not found!', key);
                continue;
            }
            if (['text', 'number', 'password'].indexOf(el.type) !== -1) {
                if (this.settings[key] !== defaultValue) {
                    el.value = this.settings[key];
                } else {
                    el.value = '';
                }
                if (defaultValue || defaultValue === '' || defaultValue === 0) {
                    el.placeholder = defaultValue;
                }
            } else if (el.type === "checkbox") {
                el.checked = !!this.settings[key];
            } else if (el.type === "radio") {
                var _el = document.querySelector('input[data-option="' + key + '"][value="'+this.settings[key]+'"]');
                if (_el !== null) {
                    el = _el;
                }
                el.checked = true;
            }
        }
    },
    onHashChange: function() {
        "use strict";
        var defaultPage = 'general';
        var hash = location.hash.substr(1) || defaultPage;
        var activeItem = document.querySelector('a[data-page="'+hash+'"]');
        if (activeItem === null) {
            activeItem = document.querySelector('a[data-page="'+defaultPage+'"]');
        }
        activeItem.dispatchEvent(new CustomEvent('click', {bubbles: true, cancelable: true, detail: 'force'}));
    },
    saveChange: function(e) {
        "use strict";
        var el = e.target;
        if (el.tagName !== 'INPUT') {
            return;
        }
        var key = el.dataset.option;
        if (!key) {
            var section = el.dataset.section;
            if (section && engine.explorerOptionsObj[section]) {
                engine.explorerOptionsObj[section].enable = el.checked ? 1 : 0;
                mono.storage.set({explorerOptions: engine.explorerOptions});
            }
        }
        if (key && el.type === 'checkbox' || section) {
            var label = el.parentNode;
            if (label.classList.contains('hasChanges')) {
                label.classList.remove('hasChanges');
            } else {
                label.classList.add('hasChanges');
            }
        }
        if (!key) {
            return;
        }
        var value;
        if (el.type === 'checkbox') {
            value = el.checked ? 1 : 0;
        } else
        if (el.type === 'radio') {
            value = parseInt(el.value);
        } else
        if (el.type === 'number') {
            var number = parseInt(el.value);
            if (isNaN(number)) {
                number = parseInt(el.placeholder);
            }
            var min = parseInt(el.min);
            if (!isNaN(min) && number < min) {
                number = min;
                el.value = number;
            }
            if (isNaN(number)) {
                return;
            }
            value = number;
        } else
        if (['text', 'password'].indexOf(el.type) !== -1) {
            value = el.value;
            var placehoder = el.placeholder;
            if (!value && placehoder) {
                value = placehoder;
            }
        }

        var obj = {};
        obj[key] = value;

        mono.storage.set(obj, function() {
            if (obj.hasOwnProperty('contextMenu') || obj.hasOwnProperty('searchPopup') || obj.hasOwnProperty('invertIcon')) {
                mono.sendMessage('reloadSettings');
            }
        });
    },
    getBackupJson: function(cb) {
        "use strict";
        mono.storage.get(null, function(storage) {
            var objList = {};
            for (var key in storage) {
                if (['searchHistory', 'explorerQualityList', 'topList'].indexOf(key) !== -1) {
                    continue;
                }
                if (key.substr(0, 8) === 'expCache') {
                    continue;
                }
                objList[key] = storage[key];
            }
            cb && cb(JSON.stringify(objList));
        });
    },
    restoreSettings: function(storage) {
        "use strict";
        mono.storage.clear();
        var data = {};
        for (var item in storage) {
            var value = storage[item];
            if (storage.hasOwnProperty(item) === false || value === null) {
                continue;
            }
            data[item] = value;
        }
        mono.storage.set(data, function() {
            mono.sendMessage('reloadSettings', function() {
                window.location.reload();
            });
        });
    },
    bindBackupForm: function() {
        "use strict";
        this.domCache.backupUpdateBtn.addEventListener('click', function() {
            this.getBackupJson(function(json) {
                this.domCache.backupInp.value = json;
            }.bind(this));
        }.bind(this));
        this.domCache.restoreBtn.addEventListener('click', function() {
            try {
                var data = JSON.parse(this.domCache.restoreInp.value);
            } catch (error) {
                return alert(mono.language.error + "\n" + error);
            }
            this.restoreSettings(data);
        }.bind(this));
        this.domCache.clearCloudStorageBtn.addEventListener('click', function() {
            mono.storage.sync.clear();
            this.domCache.getFromCloudBtn.disabled = true;
        }.bind(this));
        this.domCache.saveInCloudBtn.addEventListener('click', function() {
            this.disabled = true;
            setTimeout(function() {
                this.disabled = false;
            }.bind(this), 750);

            var _this = options;
            _this.getBackupJson(function(json) {
                mono.storage.sync.set({backup: json}, function() {
                    _this.domCache.getFromCloudBtn.disabled = false;
                });
            });
        });
        this.domCache.getFromCloudBtn.addEventListener('click', function() {
            mono.storage.sync.get('backup', function(storage) {
                this.domCache.restoreInp.value = storage.backup;
            }.bind(this));
        }.bind(this));
    },
    saveProxyList: function() {
        "use strict";
        mono.storage.set({proxyList: engine.settings.proxyList}, function() {
            if (engine.settings.profileListSync) {
                mono.storage.sync.set({proxyList: engine.settings.proxyList});
            }
        });
    },
    writeProxyList: function() {
        "use strict";
        this.domCache.proxyList.textContent = '';
        mono.create(this.domCache.proxyList, {
            append: (function() {
                var list = [];
                engine.settings.proxyList.forEach(function(item, index) {
                    list.push(mono.create('div', {
                        class: ['item'],
                        append: [
                            mono.create('label', {
                                append: [
                                    mono.create('span', {
                                        text: mono.language.label
                                    }),
                                    ' ',
                                    mono.create('input', {
                                        type: 'text',
                                        class: 'label',
                                        value: item.label,
                                        on: ['keyup', mono.debounce(function() {
                                            item.label = this.value;
                                            options.saveProxyList();
                                        })]
                                    }),
                                    index === 0 ? undefined : mono.create('a', {
                                        class: ['btn', 'delete'],
                                        text: mono.language.delete,
                                        href: '#',
                                        on: ['click', function(e) {
                                            e.preventDefault();
                                            engine.settings.proxyList.splice(index, 1);
                                            options.saveProxyList();
                                            options.writeProxyList();
                                        }]
                                    })
                                ]
                            }),
                            mono.create('label', {
                                append: [
                                    mono.create('span', {
                                        text: 'URL:'
                                    }),
                                    mono.create('input', {
                                        type: 'text',
                                        class: 'url',
                                        value: item.url,
                                        on: ['keyup', mono.debounce(function() {
                                            item.url = this.value;
                                            options.saveProxyList();
                                        })]
                                    })
                                ]
                            }),
                            mono.create('div', {
                                append: [
                                    mono.create('label', {
                                        append: [
                                            mono.create('input', {
                                                type: 'checkbox',
                                                data: {
                                                    param: 'supportGetMethod'
                                                },
                                                checked: !!item.supportGetMethod
                                            }),
                                            mono.create('span', {
                                                text: mono.language.supportGetMethod
                                            })
                                        ],
                                        on: ['change', function(e) {
                                            var el = e.target;
                                            var key = el.dataset.param;
                                            if (!key) {
                                                return;
                                            }
                                            item[key] = el.checked ? 1 : 0;
                                            options.saveProxyList();
                                        }]
                                    }),
                                    mono.create('label', {
                                        append: [
                                            mono.create('input', {
                                                type: 'checkbox',
                                                data: {
                                                    param: 'supportPostMethod'
                                                },
                                                checked: !!item.supportPostMethod
                                            }),
                                            mono.create('span', {
                                                text: mono.language.supportPostMethod
                                            })
                                        ],
                                        on: ['change', function(e) {
                                            var el = e.target;
                                            var key = el.dataset.param;
                                            if (!key) {
                                                return;
                                            }
                                            item[key] = el.checked ? 1 : 0;
                                            options.saveProxyList();
                                        }]
                                    })
                                ]
                            })
                        ]
                    }));
                });
                list.push(mono.create('a', {
                    class: 'add btn',
                    href: '#',
                    text: mono.language.add,
                    on: ['click', function(e) {
                        e.preventDefault();
                        engine.settings.proxyList.push({
                            label: 'new',
                            url: '',
                            type: 0
                        });
                        options.saveProxyList();
                        options.writeProxyList();
                    }]
                }));
                return list;
            })()
        });
    },
    writeQualityList: function() {
        "use strict";
        var isEmpty = '<new>';
        var optionList = ['video', 'audio'];
        var categoryList = ['other','serials','music','games','films',
            'cartoons','books','software','anime',
            'doc','sport','xxx','humor'
        ];
        var createWord = function(word) {
            if (typeof word === 'object') {
                var useCaseSens = word.caseSens !== 0 ? 'useCaseSens' : undefined;
                var useRegexp = word.regexp === 1 ? 'useRegexp' : undefined;
                word = word.word;
            }
            return mono.create('div', {
                class: ['wordForm', useRegexp, useCaseSens],
                append: [
                    mono.create('input', {
                        type: 'text',
                        value: word
                    }),
                    mono.create('a', {
                        class: ['button','regexp','wordFormRegexp'],
                        title: mono.language.regexp,
                        href: '#'
                    }),
                    mono.create('a', {
                        class: ['button','caseSens','wordFormCaseSens'],
                        title: mono.language.caseSens,
                        href: '#'
                    }),
                    mono.create('a', {
                        class: ['button','remove','wordFormRemove'],
                        title: mono.language.delete,
                        href: '#'
                    }),
                    mono.create('a', {
                        class: ['button','new','wordFormNew'],
                        title: mono.language.add,
                        href: '#'
                    })
                ]
            });
        };
        var createWords = function(list) {
            list = list || [];
            return mono.create('div', {
                class: 'wordList',
                data: {
                    type: 'list'
                },
                append: (function() {
                    var nodeList = [];
                    nodeList.push(mono.create('span', {
                        class: 'subTitle',
                        text: mono.language.wordList
                    }));
                    list.forEach(function (word) {
                        nodeList.push(createWord(word));
                    });
                    return nodeList;
                })()
            });
        };
        var getRateOptions = function(optionName) {
            var list = document.createDocumentFragment();
            var itemList = optionList.concat(categoryList);
            for (var i = 0, name; name = itemList[i]; i++) {
                var text = name;
                if (categoryList.indexOf(name) !== -1) {
                    text += '*';
                }
                list.appendChild(mono.create('option', {
                        value: name,
                        text: text,
                        onCreate: function() {
                            if (optionName === name) {
                                this.selected = true;
                            }
                        }
                    })
                );
            }
            return list;
        };
        var createRate = function(key, value) {
            return mono.create('div', {
                class: 'rateForm',
                append: [
                    mono.create('select', {
                        append: getRateOptions(key)
                    }),
                    mono.create('input', {
                        type: 'number',
                        value: value,
                        placeholder: '0'
                    }),
                    mono.create('a', {
                        class: ['button','remove','rateFormRemove'],
                        title: mono.language.delete,
                        href: '#'
                    }),
                    mono.create('a', {
                        class: ['button','new','rateFormNew'],
                        title: mono.language.add,
                        href: '#'
                    })
                ]
            });
        };
        var createRates = function(rateList) {
            rateList = rateList || {};
            return mono.create('div', {
                class: 'rateList',
                append: (function(){
                    var list = [];
                    list.push(mono.create('span', {
                        class: 'subTitle',
                        text: mono.language.rateList
                    }));
                    for (var item in rateList) {
                        list.push(createRate(item, rateList[item]));
                    }
                    return list;
                })()
            });
        };
        var createName = function(name) {
            name = name || '';
            var input = mono.create('input', {type: 'text', name: 'title', value: name, disabled: !name});
            return mono.create('div', {
                class: ['nameItem'],
                append: [
                    mono.create('label', {
                        class: [name ? 'hasTitle' : undefined],
                        append: [
                            mono.create('input', {
                                type: 'checkbox',
                                checked: !!name,
                                on: ['change', function() {
                                    input.disabled = !this.checked;
                                    if (this.checked) {
                                        this.parentNode.classList.add('hasTitle');
                                    } else {
                                        this.parentNode.classList.remove('hasTitle');
                                    }
                                }]
                            }),
                            mono.create('span', {
                                text: mono.language.label
                            }),
                            ' ',
                            input
                        ]
                    })
                ]
            });
        };
        var getNewItemForm = function(type) {
            var typeTitle = '';
            if (!type) {
                typeTitle = mono.language.addRule
            } else
            if (type === 'sub') {
                typeTitle = mono.language.addRuleSubItem
            } else
            if (type === 'subBefore') {
                typeTitle = mono.language.addRuleBeforeItem
            } else
            if (type === 'subAfter') {
                typeTitle = mono.language.addRuleAfterItem
            }
            return mono.create('div', {
                class: 'newSubItemForm',
                data: {
                    type: type
                },
                append: mono.create('input', {
                    type: 'button',
                    value: typeTitle,
                    class: ['button','new','NewItemBtn'],
                    data: {
                        type: type
                    }
                })
            });
        };
        var getTitle = function(item) {
            var labelWords = item.list || [];
            if (labelWords.length === 0) {
                labelWords.push(isEmpty);
            }
            var wordList = [];
            labelWords.forEach(function(current) {
                var flagList = [];
                var flags = '';
                var word = current;
                if (typeof current === 'object') {
                    word = current.word;
                    if (current.caseSens !== 0) {
                        flagList.push('Aa');
                    }
                    if (current.regexp === 1) {
                        flagList.push('.*');
                    }
                }
                if (flagList.length) {
                    flags = '[' + flagList.join(',') + ']';
                }
                wordList.push(word + flags);
            });
            return wordList.join(', ');
        };
        var createItem = function(item, type) {
            var title = mono.create('span', {
                class: 'title',
                text: getTitle(item)
            });
            return mono.create('div', {
                class: 'item',
                data: {
                    type: type
                },
                append: (function () {
                    var list = [];
                    list.push(mono.create('div', {
                        class: 'header',
                        append: [
                            mono.create('a', {
                                class: ['button','remove','itemRemove'],
                                title: mono.language.delete,
                                href: '#'
                            }),
                            title,
                            mono.create('i', {class: 'collapses'})
                        ]
                    }));
                    list.push(mono.create('div', {
                        class: 'content',
                        append: [
                            createName(item.name),
                            createWords(item.list),
                            createRates(item.rate),
                            mono.create('div', {
                                class: 'itemList',
                                append: [
                                    getItemList(item.sub, 'sub'),
                                    getItemList(item.subBefore, 'subBefore'),
                                    getItemList(item.subAfter, 'subAfter')
                                ]
                            })
                        ]
                    }));
                    return list;
                })(),
                on: [
                    ['updateTitle', function() {
                        title.textContent = getTitle(item)
                    }],
                    ['click', function(e) {
                        var el = e.target;
                        var isAngle = el.classList.contains('collapses');
                        var isHeader = el.classList.contains('header');
                        var isTitle = el.classList.contains('title');
                        if (!isAngle && !isHeader && !isTitle) {
                            return;
                        }
                        if (isTitle) {
                            el = el.parentNode;
                            isHeader = true;
                        }
                        if (isHeader) {
                            el = el.querySelector('.collapses');
                        }
                        e.stopPropagation();
                        var item = el.parentNode.parentNode;
                        if (el.classList.contains('down')) {
                            el.classList.remove('down');
                            item.classList.remove('show');
                        } else {
                            el.classList.add('down');
                            item.classList.add('show');
                        }
                    }]
                ]
            });
        };
        var getItemList = function(list, type) {
            var itemList = document.createDocumentFragment();
            var newItem = getNewItemForm(type);
            if (list === undefined) {
                return newItem
            }
            for (var i = 0, item; item = list[i]; i++) {
                itemList.appendChild(createItem(item));
            }
            itemList.appendChild(newItem);
            return itemList;
        };
        var saveChilds = function(el) {
            var rList = [];
            if (el === null) {
                return rList;
            }
            var elList = el;
            if (el === options.domCache.qualityList) {
                elList = el.parentNode.querySelectorAll('.qualityList > .item');
            }
            for (var i = 0, el; el = elList[i]; i++) {
                var item = el.querySelector('.content');

                var name = undefined;
                var body = item.querySelector('.nameItem');
                body = body.querySelector('.hasTitle input[name="title"]');
                if (body) {
                    name = body.value;
                }

                var list = [];
                body = item.querySelector('.wordList[data-type="list"]');
                var nodeList = body.querySelectorAll('.wordForm > input');
                for (var n = 0, node; node = nodeList[n]; n++) {
                    if (node.type !== 'text') {
                        continue;
                    }
                    var value;
                    if (!(value = node.value)) {
                        continue;
                    }
                    var wordObj = {word: value};
                    var parent = node.parentNode;
                    var hasOptions = false;
                    if (parent.classList.contains('useCaseSens')) {
                        wordObj.caseSens = 1;
                        hasOptions = true;
                    } else {
                        wordObj.caseSens = 0;
                    }
                    if (parent.classList.contains('useRegexp')) {
                        wordObj.regexp = 1;
                        hasOptions = true;
                    }
                    if (!hasOptions) {
                        wordObj = wordObj.word;
                    }
                    list.push(wordObj);
                }

                var rate = {};
                var rateIsEmpty = true;
                body = item.querySelector('.rateList');
                nodeList = body.querySelectorAll('.rateForm');
                for (n = 0, node; node = nodeList[n]; n++) {
                    var sel = node.querySelector('select');
                    var inp = node.querySelector('input');
                    var val = parseInt(inp.value);
                    if (isNaN(val)) {
                        continue;
                    }
                    rate[sel.value] = val;
                    rateIsEmpty = false;
                }

                var sub = saveChilds(item.querySelector('.itemList .item[data-type="sub"]'));
                var subBefore = saveChilds(item.querySelector('.itemList .item[data-type="subBefore"]'));
                var subAfter = saveChilds(item.querySelector('.itemList .item[data-type="subAfter"]'));

                var rObj = {};
                if (list.length !== 0) {
                    rObj.list = list;
                }
                if (!rateIsEmpty) {
                    rObj.rate = rate;
                }
                if (name !== undefined) {
                    rObj.name = name;
                }
                if (sub.length !== 0) {
                    rObj.sub = sub;
                }
                if (subAfter.length !== 0) {
                    rObj.subAfter = subAfter;
                }
                if (subBefore.length !== 0) {
                    rObj.subBefore = subBefore;
                }

                rList.push(rObj);
            }
            return rList;
        };
        options.domCache.qualityList.textContent = '';
        mono.create(options.domCache.qualityList, {
            append: getItemList(rate.qualityList),
            on: [
                ['save', function() {
                    var list = saveChilds(this);
                    rate.readQualityList(list);
                    rate.qualityList = list;
                    mono.storage.set({qualityObj: list});
                    options.domCache.qualityList.textContent = '';
                    options.domCache.qualityList.appendChild(getItemList(rate.qualityList));
                }],
                ['reset', function() {
                    mono.storage.remove('qualityObj');
                    rate.readQualityList(rate.defaultQualityList);
                    rate.qualityList = rate.defaultQualityList;
                    options.domCache.qualityList.textContent = '';
                    options.domCache.qualityList.appendChild(getItemList(rate.qualityList));
                }],
                ['click', function(e) {
                    e.stopPropagation();
                    var el = e.target;
                    if (el.tagName === 'A') {
                        e.preventDefault();
                    }
                    var dblParent = el.parentNode.parentNode;
                    if (el.classList.contains('NewItemBtn')) {
                        var type = el.dataset.type;
                        dblParent.insertBefore(createItem({
                            list: [],
                            rate: {}
                        }, type) ,el.parentNode);
                    } else
                    if (el.classList.contains('wordFormRemove') || el.classList.contains('rateFormRemove')) {
                        if (dblParent.childNodes.length === 2) {
                            return;
                        }
                        dblParent.removeChild(el.parentNode);
                    } else
                    if (el.classList.contains('rateFormNew')) {
                        var nextEl = el.parentNode.nextElementSibling;
                        if (nextEl) {
                            dblParent.insertBefore(createRate('', 0), nextEl);
                        } else {
                            dblParent.appendChild(createRate('', 0));
                        }
                    } else
                    if (el.classList.contains('wordFormNew')) {
                        nextEl = el.parentNode.nextElementSibling;
                        if (nextEl) {
                            dblParent.insertBefore(createWord(''), nextEl);
                        } else {
                            dblParent.appendChild(createWord(''));
                        }
                    } else
                    if (el.classList.contains('itemRemove')) {
                        dblParent.parentNode.removeChild(dblParent);
                    } else
                    if (el.classList.contains('wordFormRegexp')) {
                        el.parentNode.classList.toggle('useRegexp');
                    } else
                    if (el.classList.contains('wordFormCaseSens')) {
                        el.parentNode.classList.toggle('useCaseSens');
                    }
                }]
            ]
        });
    },
    bingQualityControls: function() {
        "use strict";
        var onQualityControlsClick = function(e) {
            e.preventDefault();
            e.stopPropagation();
            var el = e.target;
                if (el === this) return;
            if (el.classList.contains('save')) {
                options.domCache.qualityList.dispatchEvent(new CustomEvent('save'));
            } else
            if (el.classList.contains('reset')) {
                options.domCache.qualityList.dispatchEvent(new CustomEvent('reset'));
            }
        };
        var nodeList = document.querySelectorAll('.qualityControls');
        for (var node, i = 0; node = nodeList[i]; i++) {
            node.addEventListener('click', onQualityControlsClick);
        }
    },
    once: function() {
        "use strict";
        mono.writeLanguage(mono.language);

        if (mono.language.langCode !== 'ru') {
            document.querySelector('input[data-option="useEnglishPosterName"]').parentNode.style.display = 'none';
        }

        document.body.classList.remove('loading');

        this.settings = engine.settings;

        this.bingQualityControls();

        engine.explorerOptions.concat(engine.defaultExplorerOptions).forEach(function createSection(item) {
            if (createSection.list === undefined) {
                createSection.list = [];
            }
            if (createSection.list.indexOf(item.type) !== -1) {
                return;
            }
            createSection.list.push(item.type);
            if (item.type === 'favorites') {
                return;
            }
            this.domCache.sectionList.appendChild(mono.create('label', {
                append: [
                    mono.create('input', {
                        type: 'checkbox',
                        data: {
                            section: item.type
                        },
                        checked: !!item.enable
                    }),
                    mono.create('span', {
                        text: mono.language[item.lang]
                    })
                ]
            }));
        }.bind(this));

        this.writeProxyList();

        mono.rmChildTextNodes(this.domCache.langSelect);
        this.domCache.langSelect.selectedIndex = this.domCache.langSelect.querySelector('[value="'+mono.language.langCode+'"]').index;
        this.domCache.langSelect.addEventListener('change', function() {
            var option = this.childNodes[this.selectedIndex];
            var langCode = option.value;
            mono.storage.set({langCode: langCode}, function () {
                location.reload();
            });
        });

        this.set_place_holder();

        this.bindBackupForm();

        this.domCache.menu = document.querySelector('.menu');
        this.domCache.menu.addEventListener('click', function(e) {
            if (e.detail === 'force') {
                e.preventDefault();
            }
            var el = e.target;
            if (el.tagName !== 'A') return;

            if (el.classList.contains('active')) {
                return;
            }
            this.activeItem && this.activeItem.classList.remove('active');
            this.activeItem = el;
            el.classList.add('active');
            this.activePage && this.activePage.classList.remove('active');
            var page = el.dataset.page;
            this.activePage = document.querySelector('.page.' + page);
            this.activePage.classList.add('active');
            if (page === 'backup') {
                this.domCache.backupUpdateBtn.dispatchEvent(new CustomEvent('click'));
            }
            if (page === 'restore') {
                mono.storage.sync.get('backup', function(storage) {
                    if (storage.backup !== undefined) {
                        return;
                    }
                    this.domCache.getFromCloudBtn.disabled = true;
                }.bind(this));
            }
        }.bind(this));
        window.addEventListener("hashchange", this.onHashChange);
        this.onHashChange();

        document.body.addEventListener('click', this.saveChange);

        document.querySelector('input[data-option="kinopoiskFolderId"]').addEventListener('change', mono.debounce(this.saveChange));

        setTimeout(function() {
            rate.init();
            options.writeQualityList();
        });
    }
};
engine.init(function() {
    options.once();
});