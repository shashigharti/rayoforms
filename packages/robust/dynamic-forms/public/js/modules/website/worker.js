importScripts('idb.js');
self.addEventListener('message', function (e) {
    let message = e.data;
    // Initiate IndexedDB instance
    fns.init();

    if (message[0] === "storeInLocal") {
        fns.addIndexedData(fns.dbPromise, message[1]).then(function () {
            // Send data back to the main thread
            self.postMessage({type: 'storeInLocal', status: true});
        }).catch(function (err) {
            self.postMessage({type: 'storeInLocal', status: false});
        });
    } else if (message[0] === "syncToLive") {
        fns.syncToLive(fns.dbPromise, message[1]);
    } else if (message[0] === "syncForms") {
        fns.syncForms(fns.dbPromise);
    }

});

const fns = {
    dbPromise: null,
    options: {
        headers: {
            "Content-Type": "application/json",
            "Accept": "application/json, text-plain, */*",
            "X-Requested-With": "XMLHttpRequest",
            "X-CSRF-TOKEN": ''
        },
        method: 'post',
        credentials: "same-origin",
        body: ''
    },
    init: () => {
        // Create Indexed DB / Get Instance if exists
        fns.dbPromise = idb.open('mis', 5, function (upgradeDb) {
            switch (upgradeDb.oldVersion) {
                case 0:
                // a placeholder case so that the switch block will
                // execute when the database is first created
                // (oldVersion is 0)
                case 1:
                    console.log("Case 1");
                    upgradeDb.createObjectStore('mis_surveys', {keyPath: 'key', autoIncrement: true});
                case 2:
                    console.log('Creating mis_surveys object store');
                    var store = upgradeDb.transaction.objectStore('mis_surveys');
                    store.createIndex('id', 'id', {unique: true});
                case 3:
                    console.log('Creating mis_forms object store');
                    upgradeDb.createObjectStore('mis_forms', {keyPath: 'id'});
                case 4:
                    var store = upgradeDb.transaction.objectStore('mis_forms');
                // store.createIndex('id', 'id');
            }
        });
    },
    getData: (page) => {
        $.post('/all_data', {search_type: 'data', token: token, page: page}, function (allSurveys) {
            // Sync data to local DB for offline usage
            if (allSurveys.length !== 0) {
                // Add new data to table, if exists replace them
                fns.addIndexedData(fns.dbPromise, allSurveys).then(function (resp) {
                    self.postMessage(resp);
                    fns.getData(++page); // Get data from next page when add complete
                }).catch(function (err) {
                    console.log(err);
                });
            }
        });
    },
    getLocalData: (dbPromise) => {
        return new Promise(function (resolve, reject) {
            dbPromise.then(function (db) {
                var tx = db.transaction('mis_surveys', 'readonly');
                var store = tx.objectStore('mis_surveys');
                return store.getAll();
            }).then(data => {
                resolve(data);
            }).catch(err => {
                reject("Failed to get all data. Err: " + err);
            });
        })
    },
    addIndexedData: (dbPromise, newData, objectStore = 'mis_surveys') => {
        return new Promise(function (resolve, reject) {
            dbPromise.then(function (db) {
                var tx = db.transaction(objectStore, 'readwrite');
                var store = tx.objectStore(objectStore);
                return store.put(newData).catch((e) => {
                    tx.abort();
                    reject(e);
                }).then(() => {
                    resolve('Data added to indexedDB successfully.');
                });
            });
        });
    },
    // Add Data to Indexed DB
    addBulkIndexedData: (dbPromise, newData, objectStore = 'mis_surveys') => {
        return new Promise(function (resolve, reject) {
            dbPromise.then(function (db) {
                var tx = db.transaction(objectStore, 'readwrite');
                var store = tx.objectStore(objectStore);
                return Promise.all(newData.map(function (item) {
                        console.log('Syncing item: ', item);
                        return store.add(item);
                    })
                ).catch((e) => {
                    tx.abort();
                    reject(e);
                }).then(() => {
                    resolve('Synced to local successfully');
                });
            });
        });
    },
    syncToLive: (dbPromise, token) => {

        fns.getLocalData(dbPromise).then((data) => {
            fns.options.body = JSON.stringify(data);
            fns.options.headers['X-CSRF-TOKEN'] = token;
            fetch('/api/sync', fns.options)
                .then((response) => {
                    return response.json();
                })
                .then((jsonObject) => {
                    console.log(jsonObject);
                })
                .catch((error) => {
                    console.log(error);
                });

        }).catch((err) => {
            console.log("Failed to sync " + err);
        })
    },
    syncForms: (dbPromise) => {
        fns.getForms().then((data) => {
            console.log("Syncing forms");
            console.log(data);
            fns.addBulkIndexedData(dbPromise, data, 'mis_forms');
        })
    },
    getForms: () => {
        return new Promise(function (resolve, reject) {
            fetch('/admin/user/getAllForms').then((data) => {
                return data.json();
            }).then((jsonString) => {
                resolve(jsonString);
            })
        })

    }

};
