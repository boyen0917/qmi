$(function(){

    init = function(){

        idb_timeline_events = new IDBStore({
          dbVersion: 1,
          storeName: 'timeline_events',
          keyPath: 'ct_ei',
          indexes: [
            { name: 'gi'}
          ]
        });
    }

    //do it
    init();
});